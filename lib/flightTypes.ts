export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

export type SearchParams = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabin: CabinClass;
};

export type FlightSegment = {
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  departing_at: string;
  arriving_at: string;
  marketingCarrier: string;
  marketingCarrierName: string;
  flightNumber: string;
  duration: string;
};

export type FlightSlice = {
  origin: string;
  destination: string;
  duration: string;
  segments: FlightSegment[];
};

export type FlightOffer = {
  id: string;
  totalAmount: string;
  totalCurrency: string;
  owner: { name: string; iata_code: string; logo_symbol_url?: string | null };
  slices: FlightSlice[];
  passengerIds: string[];
  expires_at?: string;
};

export type BookedPassenger = {
  id?: string;
  type: 'adult' | 'child' | 'infant_without_seat';
  title: string;
  given_name: string;
  family_name: string;
  born_on: string;
  email: string;
  phone_number: string;
  gender: 'm' | 'f';
};

export type ScanFrequency = 'manual' | 'daily' | 'weekly';

export type PricePoint = { price: number; at: number };

export type TrackedRoute = {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  cabin: CabinClass;
  lastPrice: number;
  currency: string;
  lastCheckedAt: number;
  createdAt: number;
  scanFrequency?: ScanFrequency;
  lowestPrice?: number;
  history?: PricePoint[];
  nickname?: string;
  bookedOrderId?: string;
};
