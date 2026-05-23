import Exa from 'exa-js';
import type { AgentTraceEmitter } from '@/lib/agents/types';

export type ExaResult = {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  score: number;
};

const FRESHNESS_MONTHS = 6;

let cached: Exa | null = null;
function client(): Exa {
  if (cached) return cached;
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error('EXA_API_KEY is not set');
  cached = new Exa(apiKey);
  return cached;
}

function freshnessDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - FRESHNESS_MONTHS);
  return d.toISOString().slice(0, 10);
}

export type SearchRedditOptions = {
  numResults?: number;
};

export async function searchReddit(
  query: string,
  subreddits: string[],
  opts: SearchRedditOptions = {},
  trace?: AgentTraceEmitter
): Promise<ExaResult[]> {
  if (subreddits.length === 0) return [];
  // Per-subreddit domain filters. Exa's primary domain match is host-level,
  // so we also post-filter URLs by subreddit segment as a defensive check.
  const domains = subreddits.map((s) => `reddit.com/r/${s}`);
  trace?.('scout', 'exa-searching', `r/${subreddits.join(', r/')}`);

  const res = await client().search(query, {
    type: 'auto',
    numResults: opts.numResults ?? 10,
    includeDomains: domains,
    startPublishedDate: freshnessDate(),
    contents: { text: { maxCharacters: 800 }, highlights: true },
  });

  const subSet = new Set(subreddits.map((s) => s.toLowerCase()));
  const normalized = (res.results ?? [])
    .map(normalize)
    .filter((r): r is ExaResult => r !== null)
    .filter((r) => {
      const m = r.url.match(/reddit\.com\/r\/([^/]+)/i);
      return m ? subSet.has(m[1].toLowerCase()) : true;
    });

  trace?.('scout', 'exa-results', `${normalized.length} reddit threads`);
  return normalized;
}

export async function searchOfficial(
  query: string,
  city: string,
  trace?: AgentTraceEmitter
): Promise<ExaResult[]> {
  trace?.('official-events', 'exa-searching', `fifa.com: "${query}" (${city})`);
  const res = await client().search(`${query} ${city} World Cup 2026`, {
    type: 'auto',
    numResults: 6,
    includeDomains: ['fifa.com'],
    startPublishedDate: freshnessDate(),
    contents: { text: { maxCharacters: 800 } },
  });
  const normalized = (res.results ?? [])
    .map(normalize)
    .filter((r): r is ExaResult => r !== null);
  trace?.('official-events', 'exa-results', `${normalized.length} fifa results`);
  return normalized;
}

function normalize(r: {
  title: string | null;
  url: string;
  text?: string;
  highlights?: string[];
  publishedDate?: string;
  score?: number;
}): ExaResult | null {
  if (!r.url) return null;
  const text = r.text ?? '';
  const highlight = r.highlights?.[0] ?? '';
  const snippet = (text || highlight).slice(0, 400);
  return {
    title: r.title ?? r.url,
    url: r.url,
    snippet,
    publishedDate: r.publishedDate,
    score: typeof r.score === 'number' ? clamp01(r.score) : 0,
  };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
