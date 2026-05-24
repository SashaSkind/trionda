// RocketRide-mediated synthesis. Routes the final natural-language answer
// through a chat pipeline so the multi-agent story actually has RocketRide
// in the live path (vs. just a .pipe file on disk).
//
// Local engine quirk: the VSCode extension starts the engine with --port=0,
// which assigns a random ephemeral TCP port at boot. Pre-5565 is the
// documented default for the cloud server, but the local engine ignores it.
// We discover the actual port via `lsof` against the running `engine`
// process. Set ROCKETRIDE_URI to a real ws:// URL to skip discovery
// (e.g. when pointing at the cloud).
//
// Falls back gracefully: if the engine isn't reachable, the caller goes
// straight to direct Gemini.

import { execSync } from 'node:child_process';
import { RocketRideClient, Question } from 'rocketride';

type Session = { client: RocketRideClient; token: string };

let sessionPromise: Promise<Session> | null = null;
let lastFailureAt = 0;
const FAILURE_BACKOFF_MS = 30_000;

export function isRocketRideConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Find the listening port of a local RocketRide engine process.
// Returns null if no engine is running. Filters to IPv4 (127.0.0.1) since
// the rocketride SDK uses ws:// which prefers v4.
let lastDiscoveryError: string | null = null;

function discoverLocalEnginePort(): number | null {
  // Try common absolute paths in case PATH is stripped inside Next's
  // route-handler subprocess. On macOS it's /usr/sbin/lsof.
  const lsofPaths = ['/usr/sbin/lsof', '/usr/bin/lsof', 'lsof'];
  for (const lsof of lsofPaths) {
    try {
      const out = execSync(`${lsof} -aPn -iTCP -sTCP:LISTEN -c engine`, {
        encoding: 'utf8',
        timeout: 2000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      // Each line after the header: "engine 12345 user ... TCP 127.0.0.1:52434 (LISTEN)"
      const v4 = out
        .split('\n')
        .slice(1)
        .map((line) => line.match(/127\.0\.0\.1:(\d+)\s*\(LISTEN\)/))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map((m) => Number(m[1]));
      // Filter out the engine's debug/data sub-ports (20000-20100 range used by
      // node-handler subprocesses, not the WS service).
      const service = v4.filter((p) => p < 19000 || p > 21000);
      if (service.length > 0) {
        lastDiscoveryError = null;
        return service[0];
      }
      lastDiscoveryError = `lsof returned no service ports (only debug ports ${v4.join(', ')})`;
      return null;
    } catch (err) {
      lastDiscoveryError = `${lsof}: ${err instanceof Error ? err.message : String(err)}`;
      // try next lsof path
    }
  }
  return null;
}

export function getLastDiscoveryError(): string | null {
  return lastDiscoveryError;
}

function resolveLocalUri(): string | null {
  // Explicit override (cloud or custom) wins.
  const envUri = process.env.ROCKETRIDE_URI;
  if (envUri && !/localhost:5565\b/.test(envUri)) {
    return envUri;
  }
  const port = discoverLocalEnginePort();
  if (!port) return null;
  return `ws://localhost:${port}/task/service`;
}

async function startSession(): Promise<Session> {
  const uri = resolveLocalUri();
  if (!uri) {
    const detail = getLastDiscoveryError() ?? 'no `engine` process found';
    throw new Error(`no RocketRide engine found: ${detail}`);
  }
  const auth = process.env.ROCKETRIDE_APIKEY || 'local-dev';

  const client = new RocketRideClient({ uri, auth });
  await client.connect();

  // Build the synthesize pipeline inline so we don't depend on RocketRide's
  // ${ROCKETRIDE_*} substitution (which reads .env, not .env.local).
  const apikey = process.env.GEMINI_API_KEY ?? '';
  const pipeline = {
    components: [
      {
        id: 'chat_1',
        provider: 'chat',
        config: { hideForm: true, mode: 'Source', parameters: {}, type: 'chat' },
      },
      {
        id: 'synth_1',
        provider: 'llm_gemini',
        config: {
          profile: 'models-gemini-flash-latest',
          'models-gemini-flash-latest': { apikey },
          parameters: {},
        },
        input: [{ lane: 'questions', from: 'chat_1' }],
      },
      {
        id: 'response_1',
        provider: 'response_answers',
        config: { laneName: 'answers' },
        input: [{ lane: 'answers', from: 'synth_1' }],
      },
    ],
    project_id: 'f8a2c9b1-3e4d-4a5b-9c6d-7e8f9a0b1c2d',
    version: 1,
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  // useExisting: true → if a pipeline with this project_id is already
  // running on the engine (e.g. from a previous Next dev reload), attach
  // to it instead of erroring with "Pipeline is already running."
  const result = await client.use({ pipeline, useExisting: true });
  return { client, token: result.token };
}

let lastSessionError: string | null = null;

async function getSession(): Promise<Session | null> {
  if (Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) {
    return null;
  }
  if (!sessionPromise) {
    sessionPromise = startSession().catch((err) => {
      lastSessionError = err instanceof Error ? err.message : String(err);
      lastFailureAt = Date.now();
      sessionPromise = null;
      throw err;
    });
  }
  try {
    return await sessionPromise;
  } catch {
    return null;
  }
}

export type SynthesizeOutcome =
  | { ok: true; text: string }
  | { ok: false; reason: string };

export async function synthesizeViaRocketRide(prompt: string): Promise<SynthesizeOutcome> {
  const session = await getSession();
  if (!session) {
    return { ok: false, reason: lastSessionError ?? 'engine not reachable' };
  }
  try {
    const q = new Question();
    q.addQuestion(prompt);
    const response = await session.client.chat({ token: session.token, question: q });
    const answer = response.answers?.[0];
    if (answer == null) return { ok: false, reason: 'pipeline returned no answer' };
    const text = typeof answer === 'string' ? answer : JSON.stringify(answer);
    // Treat empty / whitespace-only / JSON-stringified empty as failure so the
    // caller falls back to direct Gemini instead of caching a broken response.
    if (!text || !text.trim() || text === '""') {
      return { ok: false, reason: 'empty answer from pipeline' };
    }
    return { ok: true, text };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    // Drop the session so the next attempt re-connects.
    sessionPromise = null;
    return { ok: false, reason };
  }
}
