import canned from '@/data/canned-responses.json';
import { runConcierge } from '@/lib/agents/concierge';
import { makeSSEStream } from '@/lib/sse';
import { ConciergeRequestSchema, type SSEEvent } from '@/lib/types';
import { createHash } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SSE_HEADERS: HeadersInit = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), { status: 400 });
  }
  const parsed = ConciergeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'invalid request', issues: parsed.error.issues }),
      { status: 400 }
    );
  }
  const req = parsed.data;

  const stream = makeSSEStream(async (emit) => {
    if (isDemoMode()) {
      await replayCanned(req.stadiumSlug, req.message, emit);
      return;
    }
    try {
      await runConcierge(
        { message: req.message, stadiumSlug: req.stadiumSlug },
        {
          trace: (agent, phase, detail) => emit({ type: 'trace', agent, phase, detail }),
          recommendations: (items) => emit({ type: 'recommendations', items }),
          sources: (items) => emit({ type: 'sources', items }),
          token: (text) => emit({ type: 'token', text }),
        }
      );
    } finally {
      emit({ type: 'done' });
    }
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

// ── demo mode ──────────────────────────────────────────────────────────────

function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

type CannedEntry = {
  events: Exclude<SSEEvent, { type: 'done' }>[];
  delays_ms?: number[];
};
type CannedFile = Record<string, Record<string, CannedEntry>>;

async function replayCanned(
  stadiumSlug: string,
  message: string,
  emit: (e: SSEEvent) => void
): Promise<void> {
  const data = canned as CannedFile;
  const perStadium = data[stadiumSlug] ?? data['_default'];
  if (!perStadium) {
    emit({ type: 'error', message: `no canned responses for stadium ${stadiumSlug}` });
    emit({ type: 'done' });
    return;
  }
  const hash = messageHash(message);
  const entry = perStadium[hash] ?? perStadium['_default'];
  if (!entry) {
    emit({ type: 'error', message: `no canned response for message; hash=${hash}` });
    emit({ type: 'done' });
    return;
  }
  for (let i = 0; i < entry.events.length; i++) {
    const delay = entry.delays_ms?.[i] ?? 120;
    if (delay > 0) await sleep(delay);
    emit(entry.events[i]);
  }
  emit({ type: 'done' });
}

function messageHash(message: string): string {
  return createHash('sha1').update(message.trim().toLowerCase()).digest('hex').slice(0, 12);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
