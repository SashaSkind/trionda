import OpenAI from 'openai';
import { z } from 'zod';
import { PlaceMentionSchema, VibeTagSchema, type Intent, type PlaceMention } from '@/lib/types';

const BASE_URL = process.env.GMI_CLOUD_BASE_URL ?? 'https://api.gmi-serving.com/v1';
const MODEL = process.env.GMI_CLOUD_MODEL ?? 'Qwen/Qwen3-Next-80B-A3B-Instruct';

let cached: OpenAI | null = null;
function client(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.GMI_CLOUD_API_KEY;
  if (!apiKey) throw new Error('GMI_CLOUD_API_KEY is not set');
  cached = new OpenAI({ apiKey, baseURL: BASE_URL });
  return cached;
}

const ExtractResponse = z.object({
  place_mentions: z.array(PlaceMentionSchema),
});

export type ExtractInput = {
  title: string;
  url: string;
  snippet: string;
};

// Extraction-only — Exa supplies relevance ranking, so the LLM just pulls
// PlaceMention[] out of the snippets it's given.
export async function extractPlaces(
  results: ExtractInput[],
  intent: Intent
): Promise<PlaceMention[]> {
  if (results.length === 0) return [];

  const vibeList = VibeTagSchema.options.join(', ');
  const block = results
    .map((r, i) => `[${i + 1}] ${r.title}\nurl: ${r.url}\ntext: ${r.snippet}`)
    .join('\n---\n');

  const system =
    'You extract named venues from Reddit excerpts. Output strict JSON, no prose.';
  const user = [
    `Stadium: ${intent.stadium}. Vibe: ${intent.vibe_tags.join(', ') || '(any)'}.`,
    `From the excerpts below, list specific named venues (bars, restaurants, parks, plazas).`,
    `For each: name, vibe_tags (use only: ${vibeList}), supporting_quote (sentence from text), source_url (the result's url).`,
    `Skip excerpts with no named venue. Cap at 8 venues.`,
    ``,
    `Output:`,
    `{"place_mentions":[{"name":"…","vibe_tags":["bar"],"supporting_quote":"…","source_url":"…"}]}`,
    ``,
    `Excerpts:`,
    block,
  ].join('\n');

  const res = await client().chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 1024,
  });
  const text = res.choices[0]?.message?.content ?? '';
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`GMI returned non-JSON: ${text.slice(0, 200)}`);
  }
  // Tolerate the model wrapping under a different key.
  if (raw && typeof raw === 'object' && !('place_mentions' in raw)) {
    const r = raw as Record<string, unknown>;
    if ('places' in r) (raw as Record<string, unknown>).place_mentions = r.places;
    else if ('venues' in r) (raw as Record<string, unknown>).place_mentions = r.venues;
  }
  return ExtractResponse.parse(raw).place_mentions;
}
