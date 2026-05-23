import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────────────
// Request
// ────────────────────────────────────────────────────────────────────────────

export const ConciergeRequestSchema = z.object({
  message: z.string().min(1),
  stadiumSlug: z.string().min(1),
  sessionId: z.string().optional(),
});
export type ConciergeRequest = z.infer<typeof ConciergeRequestSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Intent (Gemini structured output)
// ────────────────────────────────────────────────────────────────────────────

export const VibeTagSchema = z.enum([
  'bar',
  'pub',
  'food',
  'late-night',
  'family',
  'fan-zone',
  'watch-party',
  'breakfast',
  'coffee',
  'budget',
  'upscale',
  'local',
  'tourist',
  'rowdy',
  'quiet',
]);
export type VibeTag = z.infer<typeof VibeTagSchema>;

export const TimeWindowSchema = z.object({
  start: z.string(),
  end: z.string(),
});
export type TimeWindow = z.infer<typeof TimeWindowSchema>;

export const IntentSchema = z.object({
  stadium: z.string(),
  date: z.string().optional(),
  vibe_tags: z.array(VibeTagSchema),
  time_window: TimeWindowSchema.optional(),
  radius_m: z.number().int().positive(),
  raw: z.string(),
});
export type Intent = z.infer<typeof IntentSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Scout outputs
// ────────────────────────────────────────────────────────────────────────────

export const ScoredPostSchema = z.object({
  post_id: z.string(),
  subreddit: z.string(),
  title: z.string(),
  url: z.string(),
  score: z.number(),
  relevance: z.number().min(0).max(1),
  extracted_quote: z.string(),
});
export type ScoredPost = z.infer<typeof ScoredPostSchema>;

export const PlaceMentionSchema = z.object({
  name: z.string(),
  vibe_tags: z.array(VibeTagSchema),
  supporting_quote: z.string(),
  source_url: z.string(),
});
export type PlaceMention = z.infer<typeof PlaceMentionSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Official Events outputs
// ────────────────────────────────────────────────────────────────────────────

export const LatLngSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
export type LatLng = z.infer<typeof LatLngSchema>;

export const OfficialEventSchema = z.object({
  name: z.string(),
  date: z.string(),
  location: LatLngSchema,
  description: z.string(),
  source_url: z.string(),
});
export type OfficialEvent = z.infer<typeof OfficialEventSchema>;

export const PlaceSchema = z.object({
  place_id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  address: z.string(),
  rating: z.number().optional(),
  price_level: z.number().optional(),
  open_now: z.boolean().optional(),
  website: z.string().optional(),
});
export type Place = z.infer<typeof PlaceSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Final synthesis output
// ────────────────────────────────────────────────────────────────────────────

export const RankedRecommendationSchema = z.object({
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  why: z.string(),
  sources: z.array(z.string()),
  distance_m: z.number().optional(),
  walk_minutes: z.number().optional(),
  vibe_tags: z.array(VibeTagSchema),
});
export type RankedRecommendation = z.infer<typeof RankedRecommendationSchema>;

// ────────────────────────────────────────────────────────────────────────────
// SSE event shape — locked. Frontend depends on this.
// ────────────────────────────────────────────────────────────────────────────

export const AgentTraceEventSchema = z.object({
  type: z.literal('trace'),
  agent: z.enum(['concierge', 'scout', 'official-events']),
  phase: z.string(),
  detail: z.string().optional(),
});
export type AgentTraceEvent = z.infer<typeof AgentTraceEventSchema>;

export const SourcePillSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
});
export type SourcePill = z.infer<typeof SourcePillSchema>;

export const SSEEventSchema = z.discriminatedUnion('type', [
  AgentTraceEventSchema,
  z.object({ type: z.literal('token'), text: z.string() }),
  z.object({ type: z.literal('sources'), items: z.array(SourcePillSchema) }),
  z.object({ type: z.literal('recommendations'), items: z.array(RankedRecommendationSchema) }),
  z.object({ type: z.literal('done') }),
  z.object({ type: z.literal('error'), message: z.string() }),
]);
export type SSEEvent = z.infer<typeof SSEEventSchema>;
