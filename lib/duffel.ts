// Server-side Duffel client. Only imported from app/api/* routes.
import { Duffel } from '@duffel/api';
import type { CabinClass, FlightOffer, SearchParams } from './flightTypes';

let client: Duffel | null = null;

export function getDuffel(): Duffel {
  if (!client) {
    const token = process.env.DUFFEL_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        'DUFFEL_ACCESS_TOKEN is not set. Copy .env.example to .env and fill in your Duffel token.'
      );
    }
    client = new Duffel({ token });
  }
  return client;
}

function isLocalFirstEnabled() {
  const value = process.env.EXPO_PUBLIC_VOYAGE_LOCAL_FIRST ?? process.env.VOYAGE_LOCAL_FIRST;
  return value == null || !['0', 'false', 'off'].includes(value.toLowerCase());
}

function buildPassengers(p: SearchParams) {
  const list: Array<{ type: 'adult' | 'child' | 'infant_without_seat' }> = [];
  for (let i = 0; i < p.adults; i++) list.push({ type: 'adult' });
  for (let i = 0; i < (p.children ?? 0); i++) list.push({ type: 'child' });
  for (let i = 0; i < (p.infants ?? 0); i++) list.push({ type: 'infant_without_seat' });
  return list;
}

function mapOffer(offer: any): FlightOffer {
  return {
    id: offer.id,
    totalAmount: offer.total_amount,
    totalCurrency: offer.total_currency,
    owner: {
      name: offer.owner?.name ?? 'Unknown',
      iata_code: offer.owner?.iata_code ?? '',
      logo_symbol_url: offer.owner?.logo_symbol_url ?? null,
    },
    slices: (offer.slices ?? []).map((slice: any) => ({
      origin: slice.origin?.iata_code ?? '',
      destination: slice.destination?.iata_code ?? '',
      duration: slice.duration ?? '',
      segments: (slice.segments ?? []).map((seg: any) => ({
        origin: seg.origin?.iata_code ?? '',
        originName: seg.origin?.name ?? '',
        destination: seg.destination?.iata_code ?? '',
        destinationName: seg.destination?.name ?? '',
        departing_at: seg.departing_at ?? '',
        arriving_at: seg.arriving_at ?? '',
        marketingCarrier: seg.marketing_carrier?.iata_code ?? '',
        marketingCarrierName: seg.marketing_carrier?.name ?? '',
        flightNumber: seg.marketing_carrier_flight_number ?? '',
        duration: seg.duration ?? '',
      })),
    })),
    passengerIds: (offer.passengers ?? []).map((p: any) => p.id),
    expires_at: offer.expires_at,
  };
}

export async function searchOffers(params: SearchParams): Promise<FlightOffer[]> {
  if (!process.env.DUFFEL_ACCESS_TOKEN && isLocalFirstEnabled()) {
    return mockOffers(params);
  }

  const duffel = getDuffel();
  const slices: Array<{ origin: string; destination: string; departure_date: string }> = [
    {
      origin: params.origin.toUpperCase(),
      destination: params.destination.toUpperCase(),
      departure_date: params.departureDate,
    },
  ];
  if (params.returnDate) {
    slices.push({
      origin: params.destination.toUpperCase(),
      destination: params.origin.toUpperCase(),
      departure_date: params.returnDate,
    });
  }

  const res = await duffel.offerRequests.create({
    slices,
    passengers: buildPassengers(params),
    cabin_class: params.cabin,
    return_offers: true,
  } as any);

  const offers = ((res.data as any)?.offers ?? []) as any[];
  return offers.map(mapOffer).sort((a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount));
}

export async function getOfferById(id: string): Promise<FlightOffer> {
  if (id.startsWith('mock_offer_') && isLocalFirstEnabled()) {
    return mockOfferFromId(id);
  }

  const duffel = getDuffel();
  const res = await duffel.offers.get(id, { return_available_services: true } as any);
  return mapOffer(res.data);
}

export async function createOrder(input: {
  offerId: string;
  passengers: Array<{
    id: string;
    type: 'adult' | 'child' | 'infant_without_seat';
    title: string;
    given_name: string;
    family_name: string;
    born_on: string;
    email: string;
    phone_number: string;
    gender: 'm' | 'f';
  }>;
  amount: string;
  currency: string;
}) {
  if (input.offerId.startsWith('mock_offer_') && isLocalFirstEnabled()) {
    return {
      id: `mock_order_${Date.now()}`,
      booking_reference: `VOY${Math.floor(1000 + Math.random() * 9000)}`,
      total_amount: input.amount,
      total_currency: input.currency,
      selected_offers: [input.offerId],
      passengers: input.passengers,
      created_at: new Date().toISOString(),
      metadata: { localFirst: true },
    };
  }

  const duffel = getDuffel();
  const res = await duffel.orders.create({
    selected_offers: [input.offerId],
    passengers: input.passengers,
    payments: [{ type: 'balance', amount: input.amount, currency: input.currency }],
  } as any);
  return res.data;
}

export type { CabinClass };

function mockOffers(params: SearchParams): FlightOffer[] {
  const basePrice = estimatePrice(params);
  return [
    buildMockOffer(params, 0, 'Atlas Air', 'AT', basePrice, 'PT7H20M', '08:20', '15:40'),
    buildMockOffer(params, 1, 'Northstar', 'NS', basePrice + 74, 'PT8H05M', '11:15', '19:20'),
    buildMockOffer(params, 2, 'Voyage Connect', 'VY', basePrice + 138, 'PT9H10M', '17:45', '02:55'),
  ];
}

function mockOfferFromId(id: string): FlightOffer {
  const parts = id.replace(/^mock_offer_/, '').split('_');
  const [origin = 'JFK', destination = 'LAX', departureDate = tomorrowIso(), cabin = 'economy'] =
    parts;
  const params: SearchParams = {
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    departureDate,
    adults: 1,
    cabin: cabin as CabinClass,
  };
  return buildMockOffer(
    params,
    Number(parts[4] ?? 0),
    'Atlas Air',
    'AT',
    estimatePrice(params),
    'PT7H20M',
    '08:20',
    '15:40'
  );
}

function buildMockOffer(
  params: SearchParams,
  index: number,
  airline: string,
  code: string,
  price: number,
  duration: string,
  departTime: string,
  arriveTime: string
): FlightOffer {
  const depart = `${params.departureDate}T${departTime}:00`;
  const arrive = `${params.departureDate}T${arriveTime}:00`;
  return {
    id: `mock_offer_${params.origin.toUpperCase()}_${params.destination.toUpperCase()}_${params.departureDate}_${params.cabin}_${index}`,
    totalAmount: String(price),
    totalCurrency: 'USD',
    owner: { name: airline, iata_code: code, logo_symbol_url: null },
    passengerIds: Array.from({ length: params.adults }, (_, i) => `mock_pas_${i + 1}`),
    expires_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    slices: [
      {
        origin: params.origin.toUpperCase(),
        destination: params.destination.toUpperCase(),
        duration,
        segments: [
          {
            origin: params.origin.toUpperCase(),
            originName: `${params.origin.toUpperCase()} Airport`,
            destination: params.destination.toUpperCase(),
            destinationName: `${params.destination.toUpperCase()} Airport`,
            departing_at: depart,
            arriving_at: arrive,
            marketingCarrier: code,
            marketingCarrierName: airline,
            flightNumber: `${code}${120 + index}`,
            duration,
          },
        ],
      },
    ],
  };
}

function estimatePrice(params: SearchParams) {
  const distanceSeed = Math.abs(params.origin.charCodeAt(0) - params.destination.charCodeAt(0));
  const cabinMultiplier =
    params.cabin === 'first'
      ? 4.2
      : params.cabin === 'business'
        ? 2.6
        : params.cabin === 'premium_economy'
          ? 1.55
          : 1;
  return Math.round((245 + distanceSeed * 21 + params.adults * 85) * cabinMultiplier);
}

function tomorrowIso() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}
