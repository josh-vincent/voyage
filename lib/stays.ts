// Local-first stay provider. Mirrors lib/duffel.ts shape so the rest of
// the app treats stays the same way it treats flights.
import { findAirport } from './airports';
import { api } from './apiBase';
import { photosForStay } from './photoProvider';
import type {
  StayAmenity,
  StayCancellation,
  StayOffer,
  StayPropertyType,
  StaySearchParams,
} from './stayTypes';

const PROPERTY_PALETTE: Array<{
  type: StayPropertyType;
  brand: string;
  vibes: string[];
  amenities: StayAmenity[];
  base: number;
  cancellation: StayCancellation;
}> = [
  {
    type: 'hotel',
    brand: 'Atlas House',
    vibes: [
      'Composed rooftop bar. Service that anticipates rather than asks.',
      'A quiet hotel for travellers who like their evenings unhurried.',
      'Tall windows, soft linens, and a concierge who actually answers.',
    ],
    amenities: ['wifi', 'breakfast', 'gym', 'ac', 'workspace'],
    base: 178,
    cancellation: 'free',
  },
  {
    type: 'apartment',
    brand: 'Northstar Studios',
    vibes: [
      'Self-contained loft with a working kitchen and a small balcony.',
      'Apartment-style stay for travellers who unpack rather than live out of a suitcase.',
      'Floor-through with proper espresso, a writing desk, and slow afternoons.',
    ],
    amenities: ['wifi', 'kitchen', 'workspace', 'ac'],
    base: 142,
    cancellation: 'flexible',
  },
  {
    type: 'guesthouse',
    brand: 'The Parchment Inn',
    vibes: [
      'Eight rooms above a coffee shop. Hosts who know the neighbourhood.',
      'Family-run guesthouse. Breakfast that comes with directions.',
      'Old building, warm beds, owner-led recommendations on the table.',
    ],
    amenities: ['wifi', 'breakfast', 'pet_friendly'],
    base: 118,
    cancellation: 'free',
  },
  {
    type: 'resort',
    brand: 'Mosswood Retreat',
    vibes: [
      'Pool, spa, and a long quiet pathway down to the water.',
      'Full-service resort for the trip you came on to disappear into.',
      'Cabin-style suites under pines. Restaurant on the lake.',
    ],
    amenities: ['wifi', 'pool', 'spa', 'breakfast', 'gym', 'view', 'beach'],
    base: 312,
    cancellation: 'free',
  },
  {
    type: 'hostel',
    brand: 'Saltrock Hostel',
    vibes: [
      'Private rooms with shared kitchen. Clean, central, very fairly priced.',
      'Budget-first stay for travellers who only need a bed and a door that locks.',
      'Quiet hostel with private en-suites. Friendly desk, simple breakfast.',
    ],
    amenities: ['wifi', 'kitchen', 'workspace'],
    base: 64,
    cancellation: 'flexible',
  },
  {
    type: 'bnb',
    brand: 'Brickline B&B',
    vibes: [
      'A real bed, a real breakfast, a real host.',
      'Bed-and-breakfast run by a couple who clearly enjoy doing it.',
      'Two rooms, hand-baked pastries, and unhurried mornings.',
    ],
    amenities: ['wifi', 'breakfast', 'parking', 'pet_friendly'],
    base: 96,
    cancellation: 'free',
  },
  {
    type: 'hotel',
    brand: 'Voyage Connect Suites',
    vibes: [
      'Business-traveller stalwart. Express check-in, late checkout, fast Wi-Fi.',
      'Operational hotel near transit. Perfect for the in-and-out trip.',
      'Predictable, clean, and on time. Often the right choice.',
    ],
    amenities: ['wifi', 'breakfast', 'gym', 'workspace', 'parking', 'ac'],
    base: 224,
    cancellation: 'non_refundable',
  },
];

const NEIGHBOURHOODS: Record<string, string[]> = {
  default: ['Old Town', 'Riverside', 'Harbour', 'Garden District', 'University', 'Downtown'],
  LAX: ['Venice', 'Santa Monica', 'Downtown', 'West Hollywood'],
  MIA: ['South Beach', 'Wynwood', 'Brickell', 'Coconut Grove'],
  CDG: ['Le Marais', 'Saint-Germain', 'Montmartre', 'Bastille'],
  LHR: ['Soho', 'Shoreditch', 'Notting Hill', 'South Bank'],
  NRT: ['Shibuya', 'Shinjuku', 'Ginza', 'Asakusa'],
  HND: ['Shibuya', 'Shinjuku', 'Ginza', 'Asakusa'],
  DEN: ['LoDo', 'RiNo', 'Capitol Hill', 'Highlands'],
  LAS: ['The Strip', 'Fremont', 'Summerlin'],
  JFK: ['Lower East Side', 'Williamsburg', 'East Village', 'SoHo', 'Brooklyn Heights'],
  EWR: ['Lower East Side', 'Williamsburg', 'East Village', 'SoHo'],
  BCN: ['Gòtic', 'El Born', 'Gràcia', 'Eixample'],
  MAD: ['Malasaña', 'La Latina', 'Chueca', 'Retiro'],
  FCO: ['Trastevere', 'Monti', 'Testaccio', 'Centro Storico'],
  AMS: ['Jordaan', 'De Pijp', 'Oud-West', 'Plantage'],
};

function neighbourhoodFor(city: string, salt: number): string {
  const list = NEIGHBOURHOODS[city.toUpperCase()] ?? NEIGHBOURHOODS.default;
  return list[salt % list.length];
}

function nightsBetween(checkIn: string, checkOut: string) {
  const a = Date.parse(checkIn);
  const b = Date.parse(checkOut);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

function cityNameFor(input: string): string {
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();
  const airport = findAirport(upper);
  if (airport) return airport.city;
  return trimmed
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

function seasonAdjust(date: string): number {
  // Slight bump for summer & holiday periods.
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 1;
  const m = d.getMonth();
  if (m === 6 || m === 7) return 1.18; // Jul/Aug
  if (m === 11) return 1.22; // Dec
  if (m === 0) return 1.05; // Jan
  return 1.0;
}

export function mockStays(params: StaySearchParams): StayOffer[] {
  const nights = nightsBetween(params.checkIn, params.checkOut);
  const cityName = cityNameFor(params.city);
  const cityCode = params.city.toUpperCase();
  const season = seasonAdjust(params.checkIn);
  const guestsFactor = Math.max(1, params.guests * 0.85);
  const offers: StayOffer[] = PROPERTY_PALETTE.map((p, i) => {
    const drift = ((cityCode.charCodeAt(0) || 65) + i * 13) % 23;
    const perNight = Math.round((p.base + drift * 2.7) * season * guestsFactor);
    const id = `mock_stay_${cityCode}_${params.checkIn}_${i}`;
    const reviewCount = 80 + ((cityCode.charCodeAt(1) || 65) * (i + 1)) % 1800;
    const rating = Math.max(3.6, Math.min(4.95, 4.2 + ((drift % 7) - 3) * 0.08));
    return {
      id,
      name: p.brand,
      propertyType: p.type,
      city: cityCode,
      cityName,
      neighborhood: neighbourhoodFor(cityCode, i),
      rating: Math.round(rating * 10) / 10,
      reviewCount,
      pricePerNight: perNight,
      nights,
      totalAmount: perNight * nights,
      currency: 'USD',
      amenities: p.amenities,
      cancellation: p.cancellation,
      distanceFromCenterKm: Math.round(((i % 5) * 0.6 + 0.3) * 10) / 10,
      description: p.vibes[drift % p.vibes.length],
      hostName: p.type === 'bnb' || p.type === 'guesthouse' ? `Host #${i + 1}` : undefined,
      available: true,
      createdAt: Date.now(),
      expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
      photos: photosForStay({ id, cityName, propertyType: p.type, brand: p.brand }),
    };
  });
  return offers.sort((a, b) => a.pricePerNight - b.pricePerNight);
}

// ─── client-fetch wrappers (used by the app/screens) ────────────────────────
// These call the Expo Router API routes (/api/stays/search and
// /api/stays/quote) which in turn delegate to lib/duffelStays.ts
// (Duffel-or-mock). Signatures are identical to the old direct functions so
// callers (app/screens/stays/index.tsx, etc.) require no changes.

export async function searchStays(params: StaySearchParams): Promise<StayOffer[]> {
  try {
    const res = await fetch(api('/api/stays/search'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`/api/stays/search returned ${res.status}`);
    const json = await res.json();
    return Array.isArray(json?.offers) ? json.offers : mockStays(params);
  } catch (e) {
    console.warn('[stays] searchStays fetch failed, using mock:', (e as Error).message);
    return mockStays(params);
  }
}

export async function getStayById(id: string): Promise<StayOffer | null> {
  try {
    const res = await fetch(api('/api/stays/quote'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(`/api/stays/quote returned ${res.status}`);
    const json = await res.json();
    return json?.offer ?? null;
  } catch (e) {
    console.warn('[stays] getStayById fetch failed:', (e as Error).message);
    // Fall back to mock resolution for mock ids
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
}
