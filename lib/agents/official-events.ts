import fanFestivals from '@/data/fan-festivals.json';
import { getStadium } from '@/lib/stadiums';
import { searchPlacesNear } from '@/lib/maps';
import type { Intent, OfficialEvent, Place } from '@/lib/types';
import type { AgentTraceEmitter } from '@/lib/agents/types';

type FanFestEntry = {
  name: string;
  date: string;
  location: { lat: number; lng: number };
  description: string;
  source_url: string;
};

const FAN_FESTIVALS = fanFestivals as Record<string, FanFestEntry[] | string>;

export type OfficialEventsResult = {
  fanEvents: OfficialEvent[];
  places: Place[];
};

export async function runOfficialEvents(
  stadiumSlug: string,
  intent: Intent,
  trace: AgentTraceEmitter
): Promise<OfficialEventsResult> {
  const stadium = getStadium(stadiumSlug);
  if (!stadium) throw new Error(`unknown stadium: ${stadiumSlug}`);

  trace('official-events', 'loading', `fan-festivals for ${stadium.city}`);
  const fanEvents = getFanFestivals(stadium.id, intent.date);
  trace('official-events', 'loaded', `${fanEvents.length} fan-fest entries`);

  trace('official-events', 'searching', `Google Places (New): "${placesQuery(intent)}"`);
  let places: Place[] = [];
  try {
    places = await searchPlacesNear({
      textQuery: placesQuery(intent),
      center: { lat: stadium.lat, lng: stadium.lon },
      radiusM: intent.radius_m,
      maxResults: 10,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    trace('official-events', 'places-error', msg);
  }
  const opening = filterByMatchWindow(places, intent);
  trace(
    'official-events',
    'done',
    `${opening.length} candidate places${places.length !== opening.length ? ` (filtered from ${places.length})` : ''}`
  );

  return { fanEvents, places: opening };
}

// Keyed by stadium id (lax, nyc, tor, ...) — matches data/fan-festivals.json keys.
export function getFanFestivals(stadiumId: string, date?: string): OfficialEvent[] {
  const entries = FAN_FESTIVALS[stadiumId];
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((e) => !date || sameOrBefore(e.date, date))
    .map((e) => ({
      name: e.name,
      date: e.date,
      location: { lat: e.location.lat, lng: e.location.lng },
      description: e.description,
      source_url: e.source_url,
    }));
}

function placesQuery(intent: Intent): string {
  if (intent.vibe_tags.includes('fan-zone') || intent.vibe_tags.includes('watch-party')) {
    return `World Cup watch party near ${intent.stadium}`;
  }
  if (intent.vibe_tags.includes('food')) return `restaurants near ${intent.stadium}`;
  if (intent.vibe_tags.includes('family')) return `family restaurants near ${intent.stadium}`;
  return `sports bar near ${intent.stadium}`;
}

// Stub: when time_window is set, we'd intersect with regular_opening_hours.
// We only have `open_now`, so for now we drop places that report open_now=false.
export function filterByMatchWindow(places: Place[], intent: Intent): Place[] {
  if (!intent.time_window) return places;
  return places.filter((p) => p.open_now !== false);
}

function sameOrBefore(a: string, b: string): boolean {
  return a <= b;
}
