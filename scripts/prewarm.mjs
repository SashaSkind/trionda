#!/usr/bin/env node
// Prewarm: hit the running concierge against ~3 queries per demo stadium so
// the server's in-memory agentResultCache is hot. Run 30 min before demo.
// Spec listed prewarm.ts; using .mjs to avoid pulling in tsx for one script.
//
// Usage:
//   pnpm dev    # in one terminal, with real keys in .env.local
//   pnpm prewarm

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const QUERIES = {
  sofi: [
    'post-match bar near SoFi for Mexico vs USA',
    'family-friendly food near SoFi before the match',
    'late-night spot after a SoFi knockout game',
  ],
  metlife: [
    'pub near MetLife for the USA opener',
    'tailgate food near MetLife',
    'official fan zone near MetLife',
  ],
  'att-stadium': [
    'sports bar near AT&T Stadium for the quarterfinal',
    'fan zone in Dallas for the World Cup',
    'family restaurant near AT&T Stadium',
  ],
  'bmo-field': [
    'pub near BMO Field for Canada match',
    'best watch party in Toronto',
    'food near BMO Field before kickoff',
  ],
};

async function consume(stadiumSlug, message) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/concierge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, stadiumSlug }),
  });
  if (!res.ok || !res.body) {
    return { ok: false, ms: Date.now() - t0, status: res.status };
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let recs = 0;
  let tokens = 0;
  let saw_done = false;
  outer: while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buf.indexOf('\n\n')) !== -1) {
      const chunk = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      let data = '';
      for (const line of chunk.split('\n')) if (line.startsWith('data:')) data += line.slice(5).trim();
      if (!data) continue;
      try {
        const e = JSON.parse(data);
        if (e.type === 'recommendations') recs = e.items.length;
        else if (e.type === 'token') tokens++;
        else if (e.type === 'done') {
          saw_done = true;
          break outer;
        }
      } catch {
        // ignore
      }
    }
  }
  return { ok: saw_done, ms: Date.now() - t0, recs, tokens };
}

async function main() {
  let failures = 0;
  for (const [slug, queries] of Object.entries(QUERIES)) {
    for (const q of queries) {
      const r = await consume(slug, q);
      const tag = r.ok ? 'OK ' : 'FAIL';
      console.log(`${tag} ${r.ms.toString().padStart(5)}ms  ${slug.padEnd(18)} ${q}`);
      if (!r.ok) failures++;
    }
  }
  console.log(`\nprewarm complete: ${failures} failures`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('prewarm error:', err);
  process.exit(1);
});
