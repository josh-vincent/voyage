// City centroids for the cities Voyage knows. Used to place stays and
// activities on a map when the underlying record only has a city name /
// IATA. Activities and stays get a synthetic offset off this centroid
// keyed by an index for visual variety.

export type CityCoord = { lat: number; lng: number };

const CITY_COORDS: Record<string, CityCoord> = {
  'New York': { lat: 40.7831, lng: -73.9712 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  Miami: { lat: 25.7617, lng: -80.1918 },
  Lisbon: { lat: 38.7223, lng: -9.1393 },
  London: { lat: 51.5074, lng: -0.1278 },
  Paris: { lat: 48.8566, lng: 2.3522 },
  Tokyo: { lat: 35.6762, lng: 139.6503 },
  Rome: { lat: 41.9028, lng: 12.4964 },
  Barcelona: { lat: 41.3851, lng: 2.1734 },
  Amsterdam: { lat: 52.3676, lng: 4.9041 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  Singapore: { lat: 1.3521, lng: 103.8198 },
  Sydney: { lat: -33.8688, lng: 151.2093 },
};

// IATA → canonical city name used by COORDS above.
const IATA_TO_CITY: Record<string, string> = {
  JFK: 'New York',
  EWR: 'New York',
  LGA: 'New York',
  LAX: 'Los Angeles',
  MIA: 'Miami',
  LIS: 'Lisbon',
  LHR: 'London',
  LGW: 'London',
  STN: 'London',
  CDG: 'Paris',
  ORY: 'Paris',
  NRT: 'Tokyo',
  HND: 'Tokyo',
  FCO: 'Rome',
  BCN: 'Barcelona',
  AMS: 'Amsterdam',
  DXB: 'Dubai',
  SIN: 'Singapore',
  SYD: 'Sydney',
};

export function cityCoord(input: string): CityCoord | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (CITY_COORDS[trimmed]) return CITY_COORDS[trimmed];
  const upper = trimmed.toUpperCase();
  const mappedCity = IATA_TO_CITY[upper];
  if (mappedCity && CITY_COORDS[mappedCity]) return CITY_COORDS[mappedCity];
  const ci = Object.keys(CITY_COORDS).find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (ci) return CITY_COORDS[ci];
  return null;
}

// Deterministic small offset off a city centroid for placing N items
// without them stacking on each other. Roughly 0.5–2.5 km around the
// centroid; enough to read on a city-level map zoom without being
// physically meaningful.
export function offsetFromCity(
  centroid: CityCoord,
  index: number,
  spreadKm = 1.6,
): CityCoord {
  const angle = (index * 137.5 * Math.PI) / 180; // golden-angle sampling
  const radius = Math.max(0.0025, (spreadKm / 111) * (1 - 1 / (index + 2)));
  return {
    lat: centroid.lat + radius * Math.sin(angle),
    lng: centroid.lng + radius * Math.cos(angle),
  };
}
