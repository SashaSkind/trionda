#!/usr/bin/env node
// Probe each external API with the cheapest possible call. Reports
// OK / FAIL / UNSET per key. Loads .env.local via --env-file (Node 20+).
//
// Usage:
//   node --env-file=.env.local scripts/check-keys.mjs

const checks = [];

function add(name, envVar, run) {
  checks.push({ name, envVar, run });
}

// ── Google Maps server key (Places API New) ────────────────────────────────
add('Google Maps SERVER (Places API New)', 'GOOGLE_MAPS_API_KEY', async () => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return { status: 'UNSET' };
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName',
    },
    body: JSON.stringify({ textQuery: 'coffee in San Francisco', maxResultCount: 1 }),
  });
  if (res.ok) {
    const j = await res.json();
    const n = j.places?.length ?? 0;
    return { status: 'OK', detail: `200, ${n} place(s) returned` };
  }
  const text = await res.text();
  return { status: 'FAIL', detail: `${res.status} ${text.slice(0, 180)}` };
});

// ── Google Maps server key (Distance Matrix) ───────────────────────────────
add('Google Maps SERVER (Distance Matrix)', 'GOOGLE_MAPS_API_KEY', async () => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return { status: 'UNSET' };
  const u = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  u.searchParams.set('origins', '33.9534,-118.3387');
  u.searchParams.set('destinations', '34.0451,-118.2673');
  u.searchParams.set('mode', 'walking');
  u.searchParams.set('key', key);
  const res = await fetch(u);
  if (!res.ok) return { status: 'FAIL', detail: `HTTP ${res.status}` };
  const j = await res.json();
  if (j.status !== 'OK') {
    return { status: 'FAIL', detail: `API status=${j.status}${j.error_message ? ': ' + j.error_message : ''}` };
  }
  const el = j.rows?.[0]?.elements?.[0];
  return { status: 'OK', detail: `${el?.distance?.text ?? '?'} / ${el?.duration?.text ?? '?'}` };
});

// ── Google Maps BROWSER key — shape check + Maps JS bootstrap ──────────────
add('Google Maps BROWSER key', 'NEXT_PUBLIC_GOOGLE_MAPS_KEY', async () => {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key) return { status: 'UNSET' };
  if (!/^AIza[A-Za-z0-9_-]{30,}$/.test(key)) {
    return { status: 'FAIL', detail: 'does not look like a Google API key (expected "AIza...")' };
  }
  // Maps JS doesn't validate referrer-restricted keys server-side, so we can
  // only sanity-check that the bootstrap URL responds. Real validation runs
  // in the browser when the SDK loads.
  const res = await fetch(`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async`);
  if (!res.ok) return { status: 'FAIL', detail: `bootstrap HTTP ${res.status}` };
  const body = await res.text();
  if (/InvalidKeyMapError|ApiNotActivatedMapError|RefererNotAllowedMapError/.test(body)) {
    const m = body.match(/(InvalidKeyMapError|ApiNotActivatedMapError|RefererNotAllowedMapError)/);
    return { status: 'FAIL', detail: `${m?.[1]} in bootstrap (likely fine if referrer-restricted)` };
  }
  return { status: 'OK', detail: 'shape OK, bootstrap loads (real check is in browser)' };
});

// ── Gemini ─────────────────────────────────────────────────────────────────
add('Gemini', 'GEMINI_API_KEY', async () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { status: 'UNSET' };
  const model = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'reply with the single word: ok' }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 10 },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { status: 'FAIL', detail: `${res.status} ${t.slice(0, 180)}` };
  }
  const j = await res.json();
  const text = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return { status: 'OK', detail: `${model} replied: ${JSON.stringify(text ?? '')}` };
});

// ── GMI Cloud ──────────────────────────────────────────────────────────────
add('GMI Cloud (OpenAI-compatible)', 'GMI_CLOUD_API_KEY', async () => {
  const key = process.env.GMI_CLOUD_API_KEY;
  if (!key) return { status: 'UNSET' };
  const baseURL = process.env.GMI_CLOUD_BASE_URL ?? 'https://api.gmi-serving.com/v1';
  const model = process.env.GMI_CLOUD_MODEL ?? 'meta-llama/Llama-3.1-8B-Instruct';
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'reply with the single word: ok' }],
      max_tokens: 10,
      temperature: 0,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { status: 'FAIL', detail: `${res.status} ${t.slice(0, 180)}` };
  }
  const j = await res.json();
  const text = j.choices?.[0]?.message?.content?.trim();
  return { status: 'OK', detail: `${model} replied: ${JSON.stringify(text ?? '')}` };
});

// ── Exa ────────────────────────────────────────────────────────────────────
add('Exa', 'EXA_API_KEY', async () => {
  const key = process.env.EXA_API_KEY;
  if (!key) return { status: 'UNSET' };
  const res = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
    body: JSON.stringify({
      query: 'world cup 2026 SoFi Stadium',
      numResults: 1,
      includeDomains: ['reddit.com'],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    return { status: 'FAIL', detail: `${res.status} ${t.slice(0, 180)}` };
  }
  const j = await res.json();
  const n = j.results?.length ?? 0;
  return { status: 'OK', detail: `${n} result(s) returned` };
});

// ── runner ────────────────────────────────────────────────────────────────

const pad = (s, n) => (s.length >= n ? s : s + ' '.repeat(n - s.length));
const COL = { OK: '\x1b[32m', FAIL: '\x1b[31m', UNSET: '\x1b[33m', RESET: '\x1b[0m' };

let okCount = 0;
let failCount = 0;
let unsetCount = 0;

for (const c of checks) {
  let result;
  try {
    result = await c.run();
  } catch (err) {
    result = { status: 'FAIL', detail: err instanceof Error ? err.message : String(err) };
  }
  if (result.status === 'OK') okCount++;
  else if (result.status === 'FAIL') failCount++;
  else unsetCount++;
  const color = COL[result.status] ?? '';
  console.log(`${color}${pad(result.status, 5)}${COL.RESET}  ${pad(c.name, 40)}  ${result.detail ?? ''}`);
}

console.log(`\n${okCount} OK, ${failCount} FAIL, ${unsetCount} UNSET`);
process.exit(failCount === 0 ? 0 : 1);
