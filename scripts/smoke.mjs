#!/usr/bin/env node
// Smoke test: POSTs to /api/concierge and asserts the SSE stream contains at
// least one of each expected event type (trace, recommendations, sources,
// token, done) AND that sources[] contains at least one reddit.com URL
// (Scout-via-Exa contract check). Requires the dev server running at
// http://localhost:3000 (or pass BASE_URL=...).
//
// In DEMO_MODE the canned replay is exercised — Exa isn't called; the
// canned-responses.json already contains reddit.com source URLs, so this is
// the "Exa mocked" path. In live mode (NEXT_PUBLIC_DEMO_MODE=false) the
// real Exa call must populate reddit.com URLs.
//
// Usage:
//   pnpm dev
//   pnpm smoke

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

async function main() {
  const res = await fetch(`${BASE}/api/concierge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'post-match bar near SoFi for Mexico vs USA',
      stadiumSlug: 'sofi',
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`unexpected status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const counts = { trace: 0, token: 0, recommendations: 0, sources: 0, done: 0, error: 0 };
  let recommendationsItems = null;
  let sourcesItems = [];
  let agentsSeen = new Set();
  let firstRecIndex = -1;
  let firstTokenIndex = -1;
  let eventIndex = 0;

  outer: while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buf.indexOf('\n\n')) !== -1) {
      const chunk = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      let data = '';
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      let event;
      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }
      if (!event || typeof event.type !== 'string') continue;
      eventIndex++;
      counts[event.type] = (counts[event.type] ?? 0) + 1;
      if (event.type === 'trace') agentsSeen.add(event.agent);
      if (event.type === 'recommendations') {
        recommendationsItems = event.items;
        if (firstRecIndex === -1) firstRecIndex = eventIndex;
      }
      if (event.type === 'sources') {
        sourcesItems = sourcesItems.concat(event.items);
      }
      if (event.type === 'token' && firstTokenIndex === -1) firstTokenIndex = eventIndex;
      if (event.type === 'done') break outer;
    }
  }

  const failures = [];
  if (counts.trace < 5) failures.push(`trace count ${counts.trace} < 5`);
  if (counts.recommendations < 1) failures.push('no recommendations event');
  if (counts.sources < 1) failures.push('no sources event');
  if (counts.token < 3) failures.push(`token count ${counts.token} < 3`);
  if (counts.done !== 1) failures.push(`done count ${counts.done} != 1`);
  if (!Array.isArray(recommendationsItems) || recommendationsItems.length < 1) {
    failures.push('recommendations items empty');
  }
  for (const a of ['concierge', 'scout', 'official-events']) {
    if (!agentsSeen.has(a)) failures.push(`no trace events from agent ${a}`);
  }
  if (firstRecIndex !== -1 && firstTokenIndex !== -1 && firstRecIndex > firstTokenIndex) {
    failures.push('recommendations arrived AFTER first token (contract: before)');
  }
  const redditSources = sourcesItems.filter(
    (s) => s && typeof s.url === 'string' && /reddit\.com/i.test(s.url)
  );
  if (redditSources.length === 0) {
    failures.push('sources[] has no reddit.com URLs (Exa contract)');
  }

  if (failures.length) {
    console.error('SMOKE FAILED:');
    for (const f of failures) console.error('  -', f);
    console.error('  counts:', counts);
    process.exit(1);
  }
  console.log(
    `SMOKE OK — trace=${counts.trace} recs=${recommendationsItems.length} sources=${sourcesItems.length} (${redditSources.length} reddit) tokens=${counts.token} done=${counts.done}`
  );
}

main().catch((err) => {
  console.error('SMOKE ERROR:', err);
  process.exit(1);
});
