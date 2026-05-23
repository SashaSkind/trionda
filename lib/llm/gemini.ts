import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { IntentSchema, type Intent, type Place, type PlaceMention, type RankedRecommendation } from '@/lib/types';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash';

let cachedClient: GoogleGenAI | null = null;
function client(): GoogleGenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

// JSON Schema for Gemini's responseSchema field. Keep in sync with IntentSchema.
const INTENT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    stadium: { type: 'string' },
    date: { type: 'string' },
    vibe_tags: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'bar', 'pub', 'food', 'late-night', 'family', 'fan-zone', 'watch-party',
          'breakfast', 'coffee', 'budget', 'upscale', 'local', 'tourist', 'rowdy', 'quiet',
        ],
      },
    },
    time_window: {
      type: 'object',
      properties: { start: { type: 'string' }, end: { type: 'string' } },
      required: ['start', 'end'],
    },
    radius_m: { type: 'integer' },
    raw: { type: 'string' },
  },
  required: ['stadium', 'vibe_tags', 'radius_m', 'raw'],
} as const;

export async function parseIntent(message: string, stadiumName: string): Promise<Intent> {
  const prompt = [
    `You convert a free-text user request into a structured Intent for a World Cup recommendations agent.`,
    `Stadium context: ${stadiumName}.`,
    `User message: """${message}"""`,
    ``,
    `Rules:`,
    `- "stadium" must echo the stadium name exactly.`,
    `- "vibe_tags" is a small set (1–3) of tags drawn from the enum.`,
    `- "radius_m" defaults to 2000 for "near the stadium" requests, 5000 for "in the area".`,
    `- "raw" must be the user's message verbatim.`,
    `- Omit "date" and "time_window" if not stated.`,
  ].join('\n');

  const res = await client().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: INTENT_RESPONSE_SCHEMA,
      temperature: 0,
    },
  });
  const text = res.text ?? '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned non-JSON for intent: ${text.slice(0, 200)}`);
  }
  return IntentSchema.parse(parsed);
}

export type SynthesisContext = {
  intent: Intent;
  recommendations: RankedRecommendation[];
  placeMentions: PlaceMention[];
  places: Place[];
};

export async function* synthesizeStream(ctx: SynthesisContext): AsyncIterable<string> {
  const prompt = buildSynthesisPrompt(ctx);
  const stream = await client().models.generateContentStream({
    model: MODEL,
    contents: prompt,
    config: { temperature: 0.4 },
  });
  for await (const chunk of stream) {
    const piece = chunk.text;
    if (piece) yield piece;
  }
}

function buildSynthesisPrompt(ctx: SynthesisContext): string {
  const recs = ctx.recommendations
    .map(
      (r, i) =>
        `${i + 1}. ${r.name} (${r.walk_minutes ?? '?'} min walk, ${r.vibe_tags.join('/')}) — sources: ${r.sources.join(', ')}\n   why-seed: ${r.why}`
    )
    .join('\n');
  const quotes = ctx.placeMentions
    .slice(0, 4)
    .map((m) => `- "${m.supporting_quote}" — ${m.source_url}`)
    .join('\n');
  return [
    `You are the Trionda concierge for World Cup 2026. The user asked: """${ctx.intent.raw}"""`,
    `Vibe: ${ctx.intent.vibe_tags.join(', ')}.`,
    ``,
    `Here are 3 ranked recommendations already chosen for the user:`,
    recs,
    ``,
    `Reddit excerpts (supporting evidence — quote at most one):`,
    quotes || '(none)',
    ``,
    `Write a tight 3-sentence summary that names each place and gives one concrete reason per place. ` +
      `No headings, no bullets. Plain prose. Do not invent places not in the list above.`,
  ].join('\n');
}
