import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';
import { findAirport, AIRPORTS } from '@/lib/airports';

export const locationTools: ToolFactory = (ctx) => ({
  userLocation: tool({
    description:
      'Return the user\'s current location context: home airport, city, country, timezone, coordinates (if shared). Use this whenever the user omits their origin, asks "from here", or needs anything localised.',
    inputSchema: z.object({}),
    execute: async () => {
      const home = ctx.homeAirport ? findAirport(ctx.homeAirport) : undefined;
      return {
        homeAirport: ctx.homeAirport ?? null,
        homeCity: home?.city ?? ctx.city ?? null,
        country: home?.country ?? ctx.countryCode ?? null,
        timezone: ctx.timezone ?? null,
        coords: ctx.coords ?? null,
        locale: ctx.locale ?? null,
      };
    },
  }),

  lookupAirport: tool({
    description:
      'Look up an airport by IATA code (3 letters) or by city name. Returns IATA, city, country, timezone.',
    inputSchema: z.object({
      query: z.string().describe('IATA code like "JFK" or a city name like "Tokyo"'),
    }),
    execute: async ({ query }) => {
      const direct = findAirport(query);
      if (direct) return { match: 'iata', ...direct };
      const q = query.trim().toLowerCase();
      const byCity = AIRPORTS.find(
        (a) => a.city.toLowerCase() === q || a.city.toLowerCase().includes(q),
      );
      if (byCity) return { match: 'city', ...byCity };
      return { match: 'none', query };
    },
  }),
});
