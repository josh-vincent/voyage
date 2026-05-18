import type { Tool } from 'ai';

export type TravelerProfileSummary = {
  givenName?: string;
  familyName?: string;
  preferredCabin?: 'economy' | 'premium_economy' | 'business' | 'first';
  seatPreference?: string;       // human label like "Aisle"
  bagPreference?: string;        // human label like "1 checked"
  dietary?: string[];            // human labels like ["Vegetarian", "Halal"]
  hasPassport?: boolean;
  passportCountry?: string;
  knownTravellerNumber?: string;
  frequentFlyers?: Array<{ carrierCode: string; carrierName: string; tier?: string }>;
  savedActivityCount?: number;
  savedStayCount?: number;
};

export type TripSummary = {
  bookingReference: string;
  passengerName?: string;
  origin: string;
  destination: string;
  departingAt: string;
  carrierName?: string;
  flightNumber?: string;
  totalAmount?: string;
  totalCurrency?: string;
};

export type WatchedRouteSummary = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  cabin: string;
  lastPrice: number;
  currency: string;
  lowestPrice?: number;
};

export type CalendarEventSummary = {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
};

export type CalendarAccess = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type VoyageContext = {
  now: Date;
  homeAirport?: string;
  timezone?: string;
  coords?: { lat: number; lon: number };
  countryCode?: string;
  city?: string;
  locale?: string;
  travelerProfile?: TravelerProfileSummary;
  upcomingTrips?: TripSummary[];
  watchedRoutes?: WatchedRouteSummary[];
  calendarAccess?: CalendarAccess;
  calendarEvents?: CalendarEventSummary[];
  calendarRange?: { start: string; end: string };
};

export type ToolMap = Record<string, Tool>;
export type ToolFactory = (ctx: VoyageContext) => ToolMap;

export function mergeTools(factories: ToolFactory[], ctx: VoyageContext): ToolMap {
  return factories.reduce<ToolMap>((acc, fn) => Object.assign(acc, fn(ctx)), {});
}
