// Server-side Duffel Stays client. Mirrors lib/duffel.ts shape.
// Uses the @duffel/api SDK (duffel.stays.search / duffel.stays.quotes.create)
// which is present in the installed @duffel/api package.
// Falls back to mockStays when EXPO_PUBLIC_VOYAGE_LOCAL_FIRST is set (or no
// token), exactly the same gate lib/duffel.ts uses for flights.
import { Duffel } from '@duffel/api';
import { mockStays } from './stays';
import { cityCoord } from './cityCoords';
import { findAirport } from './airports';
import { airportCoord } from './airportCoords';
import { photosForStay } from './photoProvider';
import type { StayAmenity, StayCancellation, StayOffer, StaySearchParams } from './stayTypes';

// ─── env helpers ───────────────────────────────────────────────────────────

function isLocalFirst(): boolean {
  const v = process.env.EXPO_PUBLIC_VOYAGE_LOCAL_FIRST ?? process.env.VOYAGE_LOCAL_FIRST;
  return v == null || !['0', 'false', 'off'].includes(v.toLowerCase());
}

function token(): string | null {
  return process.env.DUFFEL_ACCESS_TOKEN?.trim() || null;
}

// ─── Duffel SDK singleton ──────────────────────────────────────────────────

let _client: Duffel | null = null;

function getDuffelClient(apiToken: string): Duffel {
  if (!_client) {
    _client = new Duffel({ token: apiToken });
  }
  return _client;
}

// ─── coordinate resolution ─────────────────────────────────────────────────

function resolveCoords(city: string): { lat: number; lng: number } | null {
  // Try IATA first → airport coords
  const upper = city.trim().toUpperCase();
  const airport = findAirport(upper);
  if (airport) {
    const c = airportCoord(airport.iata);
    if (c) return c;
  }
  // Fall back to city name lookup (handles plain city names too)
  return cityCoord(city);
}

// ─── mapping helpers ───────────────────────────────────────────────────────

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(checkIn);
  const b = Date.parse(checkOut);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

function mapDuffelAmenity(type: string): StayAmenity | null {
  const map: Record<string, StayAmenity> = {
    parking: 'parking',
    gym: 'gym',
    wifi: 'wifi',
    pool: 'pool',
    spa: 'spa',
    pets_allowed: 'pet_friendly',
    restaurant: 'breakfast',
  };
  return map[type] ?? null;
}

function mapCancellation(row: any): StayCancellation {
  // Duffel cheapest_rate_total_amount is always present. We look at the first
  // rate's cancellation_timeline: if it has a refund entry, it's 'free' or
  // 'flexible'; otherwise 'non_refundable'. When no timeline data is
  // available we default to 'flexible'.
  const rooms = row.accommodation?.rooms ?? [];
  for (const room of rooms) {
    for (const rate of room.rates ?? []) {
      const tl: any[] = rate.cancellation_timeline ?? [];
      if (tl.length === 0) return 'non_refundable';
      const hasRefund = tl.some((t: any) => parseFloat(t.refund_amount ?? '0') > 0);
      return hasRefund ? 'free' : 'flexible';
    }
  }
  return 'flexible';
}

function mapDuffelStaysToOffers(rows: any[], params: StaySearchParams): StayOffer[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const offers: StayOffer[] = [];

  for (const row of rows) {
    const acc = row.accommodation;
    if (!acc) continue;

    const totalAmount = parseFloat(row.cheapest_rate_total_amount ?? '0');
    const currency: string = row.cheapest_rate_currency ?? 'USD';
    const pricePerNight = nights > 0 ? Math.round((totalAmount / nights) * 100) / 100 : totalAmount;

    // Star rating → our 0–5 float rating. Duffel review_score is 1–10.
    const reviewScore = acc.review_score != null ? acc.review_score / 2 : null;
    const starRating = acc.rating; // 1–5 integer or null
    const rating =
      reviewScore != null
        ? Math.min(5, Math.max(1, Math.round(reviewScore * 10) / 10))
        : starRating != null
          ? Math.min(5, Math.max(1, starRating))
          : 3.5;

    const reviewCount = acc.review_count ?? 0;

    // Amenities
    const amenities: StayAmenity[] = [];
    for (const a of acc.amenities ?? []) {
      const mapped = mapDuffelAmenity(a.type);
      if (mapped && !amenities.includes(mapped)) amenities.push(mapped);
    }
    if (!amenities.includes('wifi')) amenities.unshift('wifi'); // wifi is nearly universal; add if missing

    // Property type: Duffel doesn't expose a property_type field on search
    // results at this API version — default to 'hotel'. The quote step would
    // have richer data.
    const propertyType = 'hotel' as const;

    // ID: encode as "<searchResultId>|<rateId>" for the quote step.
    // We pick the rate id from the first available room rate.
    let rateId = '';
    for (const room of acc.rooms ?? []) {
      if (room.rates?.[0]?.id) {
        rateId = room.rates[0].id;
        break;
      }
    }
    const id = rateId ? `${row.id}|${rateId}` : row.id;

    const cityName = acc.location?.address?.city_name ?? params.city;
    const neighborhood = acc.location?.address?.line_one ?? undefined;

    // Photos: real Duffel response carries accommodation.photos[].url. When
    // empty, synthesize via photoProvider so the UI always has something to
    // render.
    const duffelPhotos = (acc.photos ?? [])
      .map((p: any) => p?.url)
      .filter((u: any): u is string => typeof u === 'string' && u.length > 0);
    const photos =
      duffelPhotos.length > 0
        ? duffelPhotos
        : photosForStay({
            id,
            cityName,
            propertyType,
            brand: acc.name,
          });

    offers.push({
      id,
      name: acc.name ?? 'Hotel',
      propertyType,
      city: params.city.toUpperCase(),
      cityName,
      neighborhood,
      rating,
      reviewCount,
      pricePerNight,
      nights,
      totalAmount,
      currency,
      amenities,
      cancellation: mapCancellation(row),
      distanceFromCenterKm: 0, // not available in search results
      description: acc.description ?? `${acc.name ?? 'Hotel'} in ${cityName}`,
      available: true,
      createdAt: Date.now(),
      expires_at: row.expires_at ?? undefined,
      photos,
    });
  }

  return offers.sort((a, b) => a.pricePerNight - b.pricePerNight);
}

// ─── public API ────────────────────────────────────────────────────────────

export async function searchStays(params: StaySearchParams): Promise<StayOffer[]> {
  const apiToken = token();
  if (!apiToken || isLocalFirst()) return mockStays(params);

  const coords = resolveCoords(params.city);
  if (!coords) return mockStays(params);

  try {
    const duffel = getDuffelClient(apiToken);
    const guests = Array.from({ length: params.guests }, () => ({ type: 'adult' as const }));

    const res = await duffel.stays.search({
      check_in_date: params.checkIn,
      check_out_date: params.checkOut,
      guests,
      rooms: params.rooms,
      location: {
        radius: 10,
        geographic_coordinates: { latitude: coords.lat, longitude: coords.lng },
      },
    });

    const results = res.data?.results ?? [];
    const mapped = mapDuffelStaysToOffers(results, params);
    return mapped.length > 0 ? mapped : mockStays(params);
  } catch (e) {
    console.warn('[duffelStays] search failed, falling back to mock:', (e as Error).message);
    return mockStays(params);
  }
}

export async function getStayById(id: string): Promise<StayOffer | null> {
  // Mock ids look like: mock_stay_<CITY>_<CHECKIN>_<INDEX>
  if (id.startsWith('mock_stay_')) {
    const m = id.match(/^mock_stay_([A-Z]+)_(\d{4}-\d{2}-\d{2})_(\d+)$/);
    if (!m) return null;
    const [, city, checkIn, idx] = m;
    const co = new Date(checkIn);
    co.setDate(co.getDate() + 3);
    const offers = mockStays({
      city,
      checkIn,
      checkOut: co.toISOString().slice(0, 10),
      guests: 2,
      rooms: 1,
    });
    return offers[Number(idx)] ?? null;
  }

  // Duffel ids are "<searchResultId>|<rateId>"
  const apiToken = token();
  if (!apiToken || isLocalFirst()) return null;

  // The pipe-separated id: first part is the search result id, second is rate id.
  const pipeIdx = id.indexOf('|');
  if (pipeIdx === -1) return null;
  const rateId = id.slice(pipeIdx + 1);

  try {
    const duffel = getDuffelClient(apiToken);
    // Create a quote from the rate id — this gives us current pricing + details.
    const res = await duffel.stays.quotes.create(rateId);
    const quote = res.data;
    if (!quote) return null;

    const acc = quote.accommodation;
    const nights = nightsBetween(quote.check_in_date, quote.check_out_date);
    const totalAmount = parseFloat(quote.total_amount);
    const pricePerNight = nights > 0 ? Math.round((totalAmount / nights) * 100) / 100 : totalAmount;

    const reviewScore = acc.review_score != null ? acc.review_score / 2 : null;
    const starRating = acc.rating;
    const rating =
      reviewScore != null
        ? Math.min(5, Math.max(1, Math.round(reviewScore * 10) / 10))
        : starRating != null
          ? Math.min(5, Math.max(1, starRating))
          : 3.5;

    const amenities: StayAmenity[] = [];
    for (const a of acc.amenities ?? []) {
      const mapped = mapDuffelAmenity(a.type);
      if (mapped && !amenities.includes(mapped)) amenities.push(mapped);
    }
    if (!amenities.includes('wifi')) amenities.unshift('wifi');

    const cityName = acc.location?.address?.city_name ?? '';

    return {
      id,
      name: acc.name ?? 'Hotel',
      propertyType: 'hotel',
      city: acc.location?.address?.city_name?.toUpperCase() ?? '',
      cityName,
      neighborhood: acc.location?.address?.line_one ?? undefined,
      rating,
      reviewCount: acc.review_count ?? 0,
      pricePerNight,
      nights,
      totalAmount,
      currency: quote.total_currency,
      amenities,
      cancellation: 'flexible',
      distanceFromCenterKm: 0,
      description: acc.description ?? `${acc.name} in ${cityName}`,
      available: true,
      createdAt: Date.now(),
      expires_at: undefined,
    };
  } catch (e) {
    console.warn('[duffelStays] getStayById failed:', (e as Error).message);
    return null;
  }
}
