import type { Place, LatLng } from '@/lib/types';

const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const DISTANCE_ENDPOINT = 'https://maps.googleapis.com/maps/api/distancematrix/json';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.primaryType',
  'places.currentOpeningHours.openNow',
  'places.websiteUri',
].join(',');

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export type SearchPlacesOptions = {
  textQuery: string;
  center: LatLng;
  radiusM: number;
  maxResults?: number;
  includedType?: string;
};

export async function searchPlacesNear(opts: SearchPlacesOptions): Promise<Place[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not set');

  const body: Record<string, unknown> = {
    textQuery: opts.textQuery,
    maxResultCount: opts.maxResults ?? 10,
    locationBias: {
      circle: {
        center: { latitude: opts.center.lat, longitude: opts.center.lng },
        radius: Math.min(opts.radiusM, 50_000),
      },
    },
  };
  if (opts.includedType) body.includedType = opts.includedType;

  const res = await fetch(PLACES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { places?: PlacesApiPlace[] };
  return (data.places ?? []).map(toPlace);
}

type PlacesApiPlace = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  primaryType?: string;
  currentOpeningHours?: { openNow?: boolean };
  websiteUri?: string;
};

export type RawPlace = PlacesApiPlace;

// Like searchPlacesNear but returns the raw Place API objects so callers can
// read fields (primaryType, userRatingCount) that the normalized Place omits.
export async function searchPlacesRaw(opts: SearchPlacesOptions): Promise<RawPlace[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not set');
  const body: Record<string, unknown> = {
    textQuery: opts.textQuery,
    maxResultCount: opts.maxResults ?? 10,
    locationBias: {
      circle: {
        center: { latitude: opts.center.lat, longitude: opts.center.lng },
        radius: Math.min(opts.radiusM, 50_000),
      },
    },
  };
  if (opts.includedType) body.includedType = opts.includedType;
  const res = await fetch(PLACES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Places API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { places?: PlacesApiPlace[] };
  return data.places ?? [];
}

function toPlace(p: PlacesApiPlace): Place {
  return {
    place_id: p.id,
    name: p.displayName?.text ?? 'Unnamed place',
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
    address: p.formattedAddress ?? '',
    rating: p.rating,
    price_level: p.priceLevel ? PRICE_LEVEL_MAP[p.priceLevel] : undefined,
    open_now: p.currentOpeningHours?.openNow,
    website: p.websiteUri,
  };
}

export type DistanceResult = {
  meters?: number;
  walkingSeconds?: number;
};

export async function walkingDistance(
  origin: LatLng,
  destinations: LatLng[]
): Promise<DistanceResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not set');
  if (destinations.length === 0) return [];

  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: destinations.map((d) => `${d.lat},${d.lng}`).join('|'),
    mode: 'walking',
    units: 'metric',
    key: apiKey,
  });
  const res = await fetch(`${DISTANCE_ENDPOINT}?${params.toString()}`);
  if (!res.ok) throw new Error(`Distance Matrix ${res.status}`);
  const data = (await res.json()) as {
    rows?: Array<{
      elements?: Array<{
        status: string;
        distance?: { value: number };
        duration?: { value: number };
      }>;
    }>;
  };
  const elements = data.rows?.[0]?.elements ?? [];
  return destinations.map((_, i) => {
    const el = elements[i];
    if (!el || el.status !== 'OK') return {};
    return { meters: el.distance?.value, walkingSeconds: el.duration?.value };
  });
}

// Fallback: straight-line distance in meters (haversine). Used when Distance
// Matrix is unavailable or for non-network paths. Walk minutes ≈ meters / 80.
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
