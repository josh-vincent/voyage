import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

export const itineraryTools: ToolFactory = (_ctx) => ({
  planItinerary: tool({
    description:
      'Draft a day-by-day itinerary skeleton for a destination. Returns structured days that the assistant can then narrate. Use for trip planning questions.',
    inputSchema: z.object({
      destination: z.string(),
      days: z.number().int().min(1).max(21),
      pace: z.enum(['slow', 'balanced', 'packed']).default('balanced'),
      interests: z.array(z.string()).optional(),
    }),
    execute: async ({ destination, days, pace, interests }) => ({
      destination,
      pace,
      interests: interests ?? [],
      days: Array.from({ length: days }, (_, i) => {
        const isArrival = i === 0;
        const isDeparture = i === days - 1 && days > 1;
        const themes = ['Orient yourself', 'Go deep on culture', 'Eat the city', 'Nature/escape', 'Off-map wander', 'Rest + revisit'];
        return {
          day: i + 1,
          theme: isArrival
            ? 'Arrival + low-key first walk'
            : isDeparture
              ? 'Slow morning + departure'
              : themes[(i - 1) % themes.length],
          slots: {
            morning: null,
            afternoon: null,
            evening: null,
          },
        };
      }),
    }),
  }),
});
