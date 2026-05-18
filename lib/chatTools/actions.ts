import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

export const actionTools: ToolFactory = (_ctx) => ({
  bookFlight: tool({
    description:
      "Open the booking checkout for a specific flight offer the user has indicated they want to book. Use after searchFlights when the user says 'book this', 'reserve the lowest fare', 'go ahead and book the Atlas Air one', etc. Returns a deep-link the chat client renders as a tappable 'Open checkout' card.",
    inputSchema: z.object({
      offerId: z.string().describe('The offer.id returned from searchFlights'),
      headline: z.string().optional().describe('Short summary the user can scan in one glance'),
    }),
    execute: async ({ offerId, headline }) => ({
      kind: 'open-link',
      pathname: '/screens/product-detail',
      params: { id: offerId },
      headline: headline ?? 'Open this flight',
      action: 'book-flight',
    }),
  }),

  reserveStay: tool({
    description:
      "Open the stay reservation flow for a saved stay offer. Use when the user says 'book the Atlas House' / 'reserve that hotel'. Returns a deep-link the chat client renders as a tappable card.",
    inputSchema: z.object({
      stayId: z.string(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      headline: z.string().optional(),
    }),
    execute: async ({ stayId, checkIn, checkOut, headline }) => ({
      kind: 'open-link',
      pathname: '/screens/stays/[id]',
      params: { id: stayId, ...(checkIn ? { checkIn } : {}), ...(checkOut ? { checkOut } : {}) },
      headline: headline ?? 'Open this stay',
      action: 'reserve-stay',
    }),
  }),

  openItinerary: tool({
    description:
      "Open the day-by-day itinerary editor for an existing trip. Use when the user says 'show me the Paris plan' / 'open the itinerary'. Pair with planItinerary to draft slots, then openItinerary to put the user in the editor.",
    inputSchema: z.object({
      tripId: z.string().describe('Trip id, e.g. trip-order-paris-june'),
      headline: z.string().optional(),
    }),
    execute: async ({ tripId, headline }) => ({
      kind: 'open-link',
      pathname: '/screens/itinerary/[tripId]',
      params: { tripId },
      headline: headline ?? 'Open itinerary',
      action: 'open-itinerary',
    }),
  }),

  openDiscover: tool({
    description:
      "Open the Discover page for a city — hand-picked things to do. Use when the user says 'what should I do in Tokyo' AFTER thingsToDo so they can save activities. Optionally pass a tripId to enter trip context.",
    inputSchema: z.object({
      city: z.string().describe('City name, e.g. Tokyo'),
      tripId: z.string().optional(),
      headline: z.string().optional(),
    }),
    execute: async ({ city, tripId, headline }) => ({
      kind: 'open-link',
      pathname: '/screens/discover/[city]',
      params: { city, ...(tripId ? { tripId } : {}) },
      headline: headline ?? `Discover ${city}`,
      action: 'open-discover',
    }),
  }),
});
