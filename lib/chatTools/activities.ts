// Re-exports the shared discover dataset via the chat tool surface so we
// don't keep two parallel city/activity lists in sync. The discover screen
// and the assistant both read from lib/discover.ts.

import { tool } from 'ai';
import { z } from 'zod';

import { getCityActivities } from '@/lib/discover';
import type { ToolFactory } from './types';

export const activityTools: ToolFactory = (_ctx) => ({
  thingsToDo: tool({
    description:
      'Get a curated list of things to do in a city. Returns handpicked highlights tagged by kind (food, culture, outdoors, nightlife, view, shopping), area, and price level (1 cheap → 3 splurge). Use this when the user asks for ideas, itineraries, or "what should I do in X".',
    inputSchema: z.object({
      city: z.string().describe('City name or IATA code'),
      kinds: z
        .array(z.enum(['food', 'culture', 'outdoors', 'nightlife', 'view', 'shopping']))
        .optional()
        .describe('Filter to these kinds only'),
      maxPrice: z.number().int().min(1).max(3).optional(),
    }),
    execute: async ({ city, kinds, maxPrice }) => {
      const resolved = getCityActivities(city);
      if (!resolved) {
        return {
          city,
          found: false,
          message: 'No curated activities yet for this city. Suggest searching online.',
        };
      }
      let list = resolved.activities;
      if (kinds?.length) list = list.filter((a) => kinds.includes(a.kind));
      if (maxPrice) list = list.filter((a) => a.priceLevel <= maxPrice);
      return {
        city: resolved.city,
        found: true,
        activities: list.map(({ id, title, area, kind, priceLevel, when, blurb }) => ({
          id,
          title,
          area,
          kind,
          priceLevel,
          when,
          blurb,
        })),
      };
    },
  }),
});
