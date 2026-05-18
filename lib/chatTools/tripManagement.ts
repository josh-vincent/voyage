import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

export const tripManagementTools: ToolFactory = (ctx) => ({
  getTrip: tool({
    description:
      'Look up a specific trip from the user\'s booked trips by booking reference or destination. Use before suggesting activities or itinerary additions to avoid duplicates.',
    inputSchema: z.object({
      bookingReference: z.string().optional().describe('Exact booking reference (6 chars)'),
      destination: z.string().optional().describe('3-letter IATA or city name of the destination'),
    }),
    execute: async ({ bookingReference, destination }) => {
      const trips = ctx.upcomingTrips ?? [];
      const normRef = bookingReference?.toUpperCase().trim();
      const normDest = destination?.toUpperCase().trim();
      const match =
        (normRef && trips.find((t) => t.bookingReference.toUpperCase() === normRef)) ||
        (normDest &&
          trips.find(
            (t) =>
              t.destination.toUpperCase() === normDest ||
              t.destination.toLowerCase() === destination?.toLowerCase()
          )) ||
        null;
      if (!match) {
        return { found: false, availableCount: trips.length };
      }
      return { found: true, trip: match };
    },
  }),

  listMyTrips: tool({
    description:
      'Return all of the user\'s upcoming booked trips. Use for "what trips do I have", "show me my bookings", or to enumerate what the user already has before suggesting something new.',
    inputSchema: z.object({}),
    execute: async () => {
      const trips = ctx.upcomingTrips ?? [];
      return {
        count: trips.length,
        trips: trips.map((t) => ({
          bookingReference: t.bookingReference,
          origin: t.origin,
          destination: t.destination,
          departingAt: t.departingAt,
          carrierName: t.carrierName,
          flightNumber: t.flightNumber,
          passengerName: t.passengerName,
          totalAmount: t.totalAmount,
          totalCurrency: t.totalCurrency,
        })),
      };
    },
  }),

  proposeAddToItinerary: tool({
    description:
      'Suggest adding an activity, stay, flight, or note to a specific day on a trip\'s itinerary. Returns a deep-link to the editor with the new slot prefilled in the URL query. Use when the user says "add X to my Paris trip on Tuesday" or "put that restaurant on day 2 of my Tokyo trip".',
    inputSchema: z.object({
      tripId: z.string().describe('Booking reference of the trip, e.g. "ABC123"'),
      dayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('YYYY-MM-DD date for the slot'),
      title: z.string().describe('Name of the activity, stay, or note to add'),
      time: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional()
        .describe('HH:MM local time, if known'),
      kind: z.enum(['activity', 'stay', 'flight', 'note']),
      detail: z.string().optional().describe('Additional detail or address'),
    }),
    execute: async ({ tripId, dayDate, title, time, kind, detail }) => ({
      kind: 'open-link',
      pathname: '/screens/itinerary/[tripId]',
      params: {
        tripId,
        addOnLoad: JSON.stringify({ dayDate, title, time, kind, detail }),
      },
      headline: `Add to ${dayDate}`,
      action: 'propose-add-itinerary',
    }),
  }),

  listMySavedDestinations: tool({
    description:
      'Return cities the user has saved activities or stays for. Useful for "where am I planning to go" or "what cities am I watching".',
    inputSchema: z.object({}),
    execute: async () => {
      const cities = new Set<string>();
      for (const t of ctx.upcomingTrips ?? []) cities.add(t.destination);
      for (const r of ctx.watchedRoutes ?? []) cities.add(r.destination);
      return { cities: Array.from(cities) };
    },
  }),
});
