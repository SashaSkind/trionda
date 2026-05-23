import { getStadium } from '@/lib/stadiums';
import { searchReddit, type ExaResult } from '@/lib/llm/exa';
import { extractPlaces } from '@/lib/llm/gmi';
import type { AgentTraceEmitter } from '@/lib/agents/types';
import type { Intent, PlaceMention, ScoredPost } from '@/lib/types';

const MAX_PLACE_MENTIONS = 5;

export type ScoutResult = {
  scoredPosts: ScoredPost[];
  placeMentions: PlaceMention[];
};

export async function runScout(
  stadiumSlug: string,
  intent: Intent,
  trace: AgentTraceEmitter
): Promise<ScoutResult> {
  const stadium = getStadium(stadiumSlug);
  if (!stadium) throw new Error(`unknown stadium: ${stadiumSlug}`);

  const query = buildQuery(intent, stadium.name);
  trace('scout', 'searching', `Exa over r/${stadium.subreddits.join(', r/')}`);
  const exaResults = await searchReddit(query, stadium.subreddits, { numResults: 12 }, trace);
  trace('scout', 'searched', `${exaResults.length} reddit threads`);

  if (exaResults.length === 0) {
    return { scoredPosts: [], placeMentions: [] };
  }

  // ScoredPost[] derives directly from Exa's ranked results. No second LLM pass
  // for relevance — Exa.score is the relevance signal.
  const scoredPosts: ScoredPost[] = exaResults.map((r) => {
    const sub = extractSubreddit(r.url) ?? stadium.subreddits[0] ?? 'unknown';
    const postId = extractPostId(r.url) ?? r.url.slice(-12);
    return {
      post_id: postId,
      subreddit: sub,
      title: r.title,
      url: r.url,
      score: r.score,
      relevance: r.score,
      extracted_quote: r.snippet,
    };
  });

  const model = process.env.GMI_CLOUD_MODEL ?? 'Qwen/Qwen3-Next-80B-A3B-Instruct';
  trace('scout', 'extracting', `${model} over ${exaResults.length} threads`);
  const mentions = await extractPlaces(exaResults, intent);
  const capped = mentions.slice(0, MAX_PLACE_MENTIONS);

  trace('scout', 'done', `${capped.length} places, ${scoredPosts.length} threads`);
  return { scoredPosts, placeMentions: capped };
}

function buildQuery(intent: Intent, stadiumName: string): string {
  const vibes = intent.vibe_tags.length ? intent.vibe_tags.join(' OR ') : 'bar OR food';
  return `${vibes} near ${stadiumName} World Cup 2026`;
}

function extractSubreddit(url: string): string | undefined {
  const m = url.match(/reddit\.com\/r\/([^/]+)/i);
  return m?.[1];
}

function extractPostId(url: string): string | undefined {
  const m = url.match(/\/comments\/([a-z0-9]+)/i);
  return m?.[1];
}
