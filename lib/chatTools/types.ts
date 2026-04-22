import type { Tool } from 'ai';

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
