import { getStadium } from '@/lib/stadiums';
import { agentResultCache, intentCacheKey, type CachedAgentResult } from '@/lib/cache';
import { buildSynthesisPrompt, parseIntent, synthesizeStream, type SynthesisContext } from '@/lib/llm/gemini';
import { synthesizeViaRocketRide } from '@/lib/llm/rocketride';
import { walkingDistance, haversineDistance } from '@/lib/maps';
import { runOfficialEvents } from '@/lib/agents/official-events';
import { runScout } from '@/lib/agents/scout';
import type { AgentTraceEmitter } from '@/lib/agents/types';
import type {
  Intent,
  OfficialEvent,
  Place,
  PlaceMention,
  RankedRecommendation,
  ScoredPost,
  SourcePill,
} from '@/lib/types';

export type ConciergeEmitter = {
  trace: AgentTraceEmitter;
  recommendations: (items: RankedRecommendation[]) => void;
  sources: (items: SourcePill[]) => void;
  token: (text: string) => void;
};

export type RunConciergeInput = {
  message: string;
  stadiumSlug: string;
};

export async function runConcierge(input: RunConciergeInput, emit: ConciergeEmitter): Promise<void> {
  const stadium = getStadium(input.stadiumSlug);
  if (!stadium) throw new Error(`unknown stadium: ${input.stadiumSlug}`);

  emit.trace('concierge', 'parsing-intent', input.message);
  const intent = await parseIntent(input.message, stadium.name);
  emit.trace('concierge', 'intent-ready', summarizeIntent(intent));

  // Cache check — full response shortcut for repeated/prewarmed queries.
  const cacheKey = intentCacheKey(input.stadiumSlug, intent);
  const cached = agentResultCache.get(cacheKey);
  if (cached) {
    emit.trace('concierge', 'cache-hit', cacheKey);
    emit.recommendations(cached.recommendations);
    emit.sources(cached.sources);
    for (const piece of chunkText(cached.synthesis, 24)) emit.token(piece);
    return;
  }

  emit.trace('concierge', 'dispatching', 'scout + official-events in parallel');

  const [scout, official] = await Promise.all([
    runScout(input.stadiumSlug, intent, emit.trace).catch((err) => {
      emit.trace('scout', 'error', err instanceof Error ? err.message : String(err));
      return { scoredPosts: [], placeMentions: [] };
    }),
    runOfficialEvents(input.stadiumSlug, intent, emit.trace).catch((err) => {
      emit.trace(
        'official-events',
        'error',
        err instanceof Error ? err.message : String(err)
      );
      return { fanEvents: [], places: [] };
    }),
  ]);

  emit.trace('concierge', 'geocoding', `${official.places.length} candidates`);
  const candidatesWithDistance = await attachDistances(
    { lat: stadium.lat, lng: stadium.lon },
    official.places,
    emit.trace
  );

  emit.trace('concierge', 'ranking', 'composing top 3');
  const recommendations = rank({
    intent,
    placeMentions: scout.placeMentions,
    places: candidatesWithDistance,
    fanEvents: official.fanEvents,
  });
  emit.recommendations(recommendations);

  const sources = collectSources(scout.scoredPosts, official.fanEvents);
  emit.sources(sources);

  const synthesisCtx: SynthesisContext = {
    intent,
    recommendations,
    placeMentions: scout.placeMentions,
    places: candidatesWithDistance,
  };
  const synthesisText = await streamSynthesis(synthesisCtx, emit);

  agentResultCache.set(cacheKey, {
    intent,
    recommendations,
    sources,
    synthesis: synthesisText,
  } satisfies CachedAgentResult);
  emit.trace('concierge', 'done', `cached as ${cacheKey}`);
}

// ── synthesis (RocketRide if available, direct Gemini fallback) ────────────

const ROCKETRIDE_DISABLED = process.env.ROCKETRIDE_DISABLED === 'true';

async function streamSynthesis(ctx: SynthesisContext, emit: ConciergeEmitter): Promise<string> {
  if (!ROCKETRIDE_DISABLED) {
    const prompt = buildSynthesisPrompt(ctx);
    emit.trace('concierge', 'synthesizing', 'RocketRide pipeline → llm_gemini');
    const outcome = await synthesizeViaRocketRide(prompt);
    if (outcome.ok) {
      // RocketRide returns the full answer (chat() is blocking). Chunk it so
      // the SSE stream still feels like progressive synthesis to the client.
      for (const piece of chunkText(outcome.text, 24)) emit.token(piece);
      return outcome.text;
    }
    emit.trace('concierge', 'rocketride-fallback', outcome.reason);
  }

  emit.trace('concierge', 'synthesizing', `direct Gemini ${process.env.GEMINI_MODEL ?? 'gemini-3.5-flash'}`);
  let text = '';
  for await (const piece of synthesizeStream(ctx)) {
    text += piece;
    emit.token(piece);
  }
  return text;
}

// ── ranking ────────────────────────────────────────────────────────────────

type CandidatePlace = Place & { distance_m?: number; walk_minutes?: number };

type RankInput = {
  intent: Intent;
  placeMentions: PlaceMention[];
  places: CandidatePlace[];
  fanEvents: OfficialEvent[];
};

function rank({ intent, placeMentions, places, fanEvents }: RankInput): RankedRecommendation[] {
  const recs: RankedRecommendation[] = [];
  const mentionedNames = new Set(placeMentions.map((m) => normalize(m.name)));

  // 1) Reddit-mentioned places that also appear in Places results — strongest signal.
  const cross = places.filter((p) => mentionedNames.has(normalize(p.name)));
  for (const p of cross.slice(0, 1)) {
    const mention = placeMentions.find((m) => normalize(m.name) === normalize(p.name));
    recs.push(toRec(p, intent, mention?.supporting_quote ?? 'Mentioned by locals on Reddit.', [
      mention?.source_url ?? 'Reddit',
      'Google Places',
    ]));
  }

  // 2) Top FIFA Fan Festival in the city.
  const fest = fanEvents[0];
  if (fest) {
    recs.push({
      name: fest.name,
      lat: fest.location.lat,
      lng: fest.location.lng,
      why: `Official FIFA fan zone — ${truncate(fest.description, 140)}`,
      sources: [fest.source_url],
      distance_m: undefined,
      walk_minutes: undefined,
      vibe_tags: ['fan-zone', 'watch-party'],
    });
  }

  // 3) Top-rated Places result that isn't already in `recs`.
  const used = new Set(recs.map((r) => normalize(r.name)));
  const remaining = [...places]
    .filter((p) => !used.has(normalize(p.name)))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (remaining[0]) {
    recs.push(
      toRec(
        remaining[0],
        intent,
        `Top-rated nearby (${remaining[0].rating?.toFixed(1) ?? '?'}★). Walkable from the stadium.`,
        ['Google Places']
      )
    );
  }

  // Backfill if we got fewer than 3 candidates (no Places key / no Reddit hits).
  while (recs.length < 3 && placeMentions[recs.length]) {
    const m = placeMentions[recs.length];
    recs.push({
      name: m.name,
      lat: 0,
      lng: 0,
      why: m.supporting_quote,
      sources: [m.source_url],
      vibe_tags: m.vibe_tags,
    });
  }

  return recs.slice(0, 3);
}

function toRec(
  p: CandidatePlace,
  intent: Intent,
  why: string,
  sources: string[]
): RankedRecommendation {
  return {
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    why,
    sources,
    distance_m: p.distance_m,
    walk_minutes: p.walk_minutes,
    vibe_tags: intent.vibe_tags.length ? intent.vibe_tags.slice(0, 2) : ['local'],
  };
}

// ── helpers ────────────────────────────────────────────────────────────────

async function attachDistances(
  origin: { lat: number; lng: number },
  places: Place[],
  trace: AgentTraceEmitter
): Promise<CandidatePlace[]> {
  if (places.length === 0) return [];
  try {
    const distances = await walkingDistance(
      origin,
      places.map((p) => ({ lat: p.lat, lng: p.lng }))
    );
    return places.map((p, i) => {
      const d = distances[i];
      return {
        ...p,
        distance_m: d?.meters,
        walk_minutes: d?.walkingSeconds ? Math.round(d.walkingSeconds / 60) : undefined,
      };
    });
  } catch (err) {
    trace('concierge', 'distance-fallback', err instanceof Error ? err.message : String(err));
    // Haversine fallback — assume 80 m/min walking pace.
    return places.map((p) => {
      const meters = Math.round(haversineDistance(origin, { lat: p.lat, lng: p.lng }));
      return { ...p, distance_m: meters, walk_minutes: Math.round(meters / 80) };
    });
  }
}

function collectSources(posts: ScoredPost[], fanEvents: OfficialEvent[]): SourcePill[] {
  const pills: SourcePill[] = [];
  for (const p of posts.slice(0, 4)) {
    pills.push({ title: `r/${p.subreddit}: ${truncate(p.title, 60)}`, url: p.url, snippet: p.extracted_quote });
  }
  for (const f of fanEvents.slice(0, 2)) {
    pills.push({ title: f.name, url: f.source_url, snippet: truncate(f.description, 120) });
  }
  return pills;
}

function summarizeIntent(intent: Intent): string {
  const bits = [intent.vibe_tags.join('/')];
  if (intent.date) bits.push(intent.date);
  bits.push(`${intent.radius_m}m`);
  return bits.filter(Boolean).join(' · ');
}

function chunkText(s: string, n: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < s.length; i += n) chunks.push(s.slice(i, i + n));
  return chunks;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 30);
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
