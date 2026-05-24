// Per-stadium "Spots nearby" data sourced live from Google Places (New).
// Called server-side from app/stadium/[id]/page.tsx so results are baked into
// the page render — no client-side fetch / loading state. Cached for an hour
// to keep the demo's Places API budget cheap (~80 calls total to populate
// every stadium × 5 categories, then cache hits forever).

import { getStadium, type Stadium } from '@/lib/stadiums';
import { searchPlacesRaw, haversineDistance, type RawPlace } from '@/lib/maps';
import { TTLCache } from '@/lib/cache';

export type Spot = {
  name: string;
  meta: string;
  why?: string;
  mapsUrl?: string;
};

export type SpotsByCategory = Record<string, Spot[]>;

// Category → Places (New) `textQuery` + `includedType` filter.
// Order here determines tab order in SpotsSection.
const CATEGORIES: Array<{
  name: string;
  query: (s: Stadium) => string;
  includedType?: string;
  labelOverride?: (primaryType: string | undefined) => string;
}> = [
  { name: 'Food',       query: (s) => `restaurants near ${s.name}`,        includedType: 'restaurant' },
  { name: 'Coffee',     query: (s) => `coffee shops near ${s.name}`,       includedType: 'cafe' },
  { name: 'Shopping',   query: (s) => `shopping near ${s.name}`,           includedType: 'shopping_mall' },
  { name: 'Nightlife',  query: (s) => `bars near ${s.name}`,               includedType: 'bar' },
  { name: 'Activities', query: (s) => `things to do near ${s.name}`,       includedType: 'tourist_attraction' },
];

const PRICE_GLYPH: Record<string, string> = {
  PRICE_LEVEL_FREE: 'Free',
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
};

const cache = new TTLCache<string, SpotsByCategory>(60 * 60 * 1000);

export async function getSpotsByCategory(stadiumId: string): Promise<SpotsByCategory> {
  const stadium = getStadium(stadiumId);
  if (!stadium) return {};
  const cached = cache.get(stadiumId);
  if (cached) return cached;

  // Fan out the 5 category queries in parallel.
  const results = await Promise.all(
    CATEGORIES.map(async (cat) => {
      try {
        const places = await searchPlacesRaw({
          textQuery: cat.query(stadium),
          center: { lat: stadium.lat, lng: stadium.lon },
          radiusM: 8_000,
          maxResults: 8,
          includedType: cat.includedType,
        });
        return [cat.name, places.slice(0, 5).map((p) => toSpot(p, stadium))] as const;
      } catch (err) {
        // Surface a category failure as an empty list — don't let one bad
        // category fail the whole page render.
        console.warn(`spots: ${cat.name} failed for ${stadiumId}:`, err);
        return [cat.name, [] as Spot[]] as const;
      }
    })
  );

  const out: SpotsByCategory = Object.fromEntries(results);
  cache.set(stadiumId, out);
  return out;
}

function toSpot(p: RawPlace, stadium: Stadium): Spot {
  const name = p.displayName?.text ?? 'Unnamed';
  const parts: string[] = [];
  if (typeof p.rating === 'number') parts.push(`★ ${p.rating.toFixed(1)}`);
  if (p.priceLevel && PRICE_GLYPH[p.priceLevel]) parts.push(PRICE_GLYPH[p.priceLevel]);
  if (p.primaryType) parts.push(prettyType(p.primaryType));
  if (p.location) {
    const meters = haversineDistance(
      { lat: stadium.lat, lng: stadium.lon },
      { lat: p.location.latitude, lng: p.location.longitude }
    );
    parts.push(`${(meters / 1609.34).toFixed(1)} mi`);
  }

  const why = whyForPlace(p);
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(p.id)}`;
  return { name, meta: parts.join(' · '), why, mapsUrl };
}

function prettyType(t: string): string {
  // "mexican_restaurant" → "Mexican Restaurant", "night_club" → "Night Club"
  return t
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function whyForPlace(p: RawPlace): string | undefined {
  const rating = p.rating ?? 0;
  const count = p.userRatingCount ?? 0;
  if (rating >= 4.7 && count >= 200) return 'locals love it';
  if (rating >= 4.5 && count >= 500) return 'tried-and-true';
  if (p.currentOpeningHours?.openNow === true) return 'open now';
  if (count >= 1000) return 'crowd favorite';
  return undefined;
}
