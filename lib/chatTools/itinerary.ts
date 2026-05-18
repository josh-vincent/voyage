import { tool } from 'ai';
import { z } from 'zod';

import { buildItinerarySkeleton } from '@/lib/itinerarySkeleton';
import type { ToolFactory } from './types';

export const itineraryTools: ToolFactory = (_ctx) => ({
  planItinerary: tool({
    description:
      'Draft a day-by-day itinerary skeleton for a destination. Returns structured days the assistant can narrate, suitable for opening in the itinerary editor. Use for trip planning questions.',
    inputSchema: z.object({
      destination: z.string(),
      days: z.number().int().min(1).max(21),
      pace: z.enum(['slow', 'balanced', 'packed']).default('balanced'),
      interests: z.array(z.string()).optional(),
      startDate: z
        .string()
        .optional()
        .describe('Optional ISO start date; defaults to today'),
      tripId: z
        .string()
        .optional()
        .describe('Optional trip id; if provided, suggest deep-linking the editor to this trip'),
    }),
    execute: async ({ destination, days, pace, interests, startDate, tripId }) => {
      const skeleton = buildItinerarySkeleton({ destination, days, pace, interests, startDate });
      return {
        destination,
        pace,
        interests: interests ?? [],
        startDate: skeleton[0]?.date,
        days: skeleton,
        openInEditor: tripId ? `/screens/itinerary/${tripId}` : null,
      };
    },
  }),
});
