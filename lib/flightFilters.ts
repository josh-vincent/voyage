import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FlightOffer } from '@/lib/flightTypes';

export type StoredFlightFilters = {
  maxPrice?: number;
  maxStops?: 0 | 1 | 2;            // 0 = nonstop only
  cabins?: Array<'economy' | 'premium_economy' | 'business' | 'first'>;
  earliestDepart?: string;          // 'HH:MM' 24h
  latestDepart?: string;            // 'HH:MM' 24h
  amenities?: Array<'wifi' | 'lie_flat' | 'power' | 'meal'>;
  maxDurationMinutes?: number;
};

const FILTERS_KEY = '@voyage/flight-filters';

export function defaultFilters(): StoredFlightFilters {
  return {};
}

export async function listFilters(): Promise<StoredFlightFilters> {
  try {
    const raw = await AsyncStorage.getItem(FILTERS_KEY);
    if (!raw) return defaultFilters();
    return JSON.parse(raw) as StoredFlightFilters;
  } catch {
    return defaultFilters();
  }
}

export async function saveFilters(f: StoredFlightFilters): Promise<void> {
  await AsyncStorage.setItem(FILTERS_KEY, JSON.stringify(f));
}

/** Parse an ISO 8601 duration string like "PT7H30M" into total minutes. */
function parseDurationMin(iso?: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  const h = parseInt(m[1] ?? '0', 10);
  const mm = parseInt(m[2] ?? '0', 10);
  return h * 60 + mm;
}

/** Extract 'HH:MM' from an ISO datetime string like "2024-12-01T09:30:00". */
function toHHMM(isoDatetime?: string): string | null {
  if (!isoDatetime) return null;
  const d = new Date(isoDatetime);
  if (Number.isNaN(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Compare two 'HH:MM' strings. Returns negative, 0, or positive. */
function cmpHHMM(a: string, b: string): number {
  return a.localeCompare(b);
}

/**
 * Pure function — returns the subset of offers that satisfy every active filter.
 * Amenities are not filterable today (no amenity data on FlightOffer) — pass-through.
 */
export function applyFilters(
  offers: FlightOffer[],
  filters: StoredFlightFilters,
): FlightOffer[] {
  return offers.filter((offer) => {
    // --- maxPrice ---
    if (filters.maxPrice !== undefined) {
      const price = parseFloat(offer.totalAmount);
      if (!Number.isNaN(price) && price > filters.maxPrice) return false;
    }

    // --- maxStops: every slice's stop count must be <= maxStops ---
    if (filters.maxStops !== undefined) {
      const exceeds = offer.slices.some(
        (s) => s.segments.length - 1 > (filters.maxStops as number),
      );
      if (exceeds) return false;
    }

    // --- earliestDepart / latestDepart on first slice's first segment ---
    if (filters.earliestDepart !== undefined || filters.latestDepart !== undefined) {
      const firstDep = offer.slices[0]?.segments[0]?.departing_at;
      const hhmm = toHHMM(firstDep);
      if (hhmm) {
        if (filters.earliestDepart && cmpHHMM(hhmm, filters.earliestDepart) < 0) return false;
        if (filters.latestDepart && cmpHHMM(hhmm, filters.latestDepart) > 0) return false;
      }
    }

    // --- maxDurationMinutes: first outbound slice duration ---
    if (filters.maxDurationMinutes !== undefined) {
      const dur = parseDurationMin(offer.slices[0]?.duration);
      if (dur > 0 && dur > filters.maxDurationMinutes) return false;
    }

    // --- amenities: no-op (no amenity data on FlightOffer) ---

    return true;
  });
}

/** Returns true when no filter constraints are set. */
export function filtersAreEmpty(f: StoredFlightFilters): boolean {
  return (
    f.maxPrice === undefined &&
    f.maxStops === undefined &&
    (f.cabins === undefined || f.cabins.length === 0) &&
    f.earliestDepart === undefined &&
    f.latestDepart === undefined &&
    (f.amenities === undefined || f.amenities.length === 0) &&
    f.maxDurationMinutes === undefined
  );
}
