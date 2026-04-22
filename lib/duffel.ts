// Server-side Duffel client. Only imported from app/api/* routes.
import { Duffel } from '@duffel/api';
import type { CabinClass, FlightOffer, SearchParams } from './flightTypes';

let client: Duffel | null = null;

export function getDuffel(): Duffel {
  if (!client) {
    const token = process.env.DUFFEL_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        'DUFFEL_ACCESS_TOKEN is not set. Copy .env.example to .env and fill in your Duffel token.',
      );
    }
    client = new Duffel({ token });
  }
  return client;
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
  return offers
    .map(mapOffer)
    .sort((a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount));
}

export async function getOfferById(id: string): Promise<FlightOffer> {
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
  const duffel = getDuffel();
  const res = await duffel.orders.create({
    selected_offers: [input.offerId],
    passengers: input.passengers,
    payments: [{ type: 'balance', amount: input.amount, currency: input.currency }],
  } as any);
  return res.data;
}

export type { CabinClass };
