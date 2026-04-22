import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

export const tripTools: ToolFactory = (ctx) => ({
  openTrip: tool({
    description:
      'Surface a tappable card that opens one of the user\'s booked trips. Call this when the user references a trip they have ("my LA flight", "the Tokyo booking", "open my next trip"). Match against the upcomingTrips provided in context by booking reference, destination, or date. If nothing matches, say so instead of guessing.',
    inputSchema: z.object({
      bookingReference: z
        .string()
        .optional()
        .describe('Exact booking reference (6 chars). Prefer this when you know it.'),
      destination: z
        .string()
        .length(3)
        .optional()
        .describe('3-letter IATA of the trip destination, used when no reference is known.'),
      note: z
        .string()
        .optional()
        .describe('Short human note shown above the card, e.g. "Your next one:".'),
    }),
    execute: async ({ bookingReference, destination, note }) => {
      const trips = ctx.upcomingTrips ?? [];
      const normRef = bookingReference?.toUpperCase().trim();
      const normDest = destination?.toUpperCase().trim();
      const match =
        (normRef && trips.find((t) => t.bookingReference.toUpperCase() === normRef)) ||
        (normDest && trips.find((t) => t.destination.toUpperCase() === normDest)) ||
        null;
      if (!match) {
        return {
          found: false,
          note:
            note ??
            (trips.length
              ? 'Couldn\'t pinpoint that trip. Here\'s what I can see.'
              : 'No booked trips on file yet.'),
          available: trips,
        };
      }
      return { found: true, trip: match, note: note ?? 'Tap to open it.' };
    },
  }),
});
