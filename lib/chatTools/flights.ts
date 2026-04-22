import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';
import { searchOffers, getOfferById } from '@/lib/duffel';

export const flightTools: ToolFactory = (ctx) => ({
  searchFlights: tool({
    description:
      'Search for flights between two airports on given dates. Returns up to 5 cheapest offers, ordered by price.',
    inputSchema: z.object({
      origin: z
        .string()
        .length(3)
        .describe(`3-letter IATA departure airport. If the user omits it, use the home airport from userLocation (${ctx.homeAirport ?? 'unknown'}).`),
      destination: z.string().length(3).describe('3-letter IATA arrival airport'),
      departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('YYYY-MM-DD'),
      returnDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('YYYY-MM-DD for round trip; omit for one-way'),
      adults: z.number().int().min(1).max(9).default(1),
      cabin: z
        .enum(['economy', 'premium_economy', 'business', 'first'])
        .default('economy'),
    }),
    execute: async (args) => {
      const offers = await searchOffers({ ...args });
      return {
        count: offers.length,
        offers: offers.slice(0, 5).map((o) => ({
          id: o.id,
          price: `${o.totalCurrency} ${o.totalAmount}`,
          totalAmount: o.totalAmount,
          totalCurrency: o.totalCurrency,
          airline: o.owner.name,
          slices: o.slices.map((s) => ({
            origin: s.origin,
            destination: s.destination,
            duration: s.duration,
            stops: Math.max(0, s.segments.length - 1),
            departing_at: s.segments[0]?.departing_at,
            arriving_at: s.segments[s.segments.length - 1]?.arriving_at,
          })),
        })),
      };
    },
  }),

  getOfferDetails: tool({
    description: 'Get detailed information for a specific flight offer by id.',
    inputSchema: z.object({ offerId: z.string() }),
    execute: async ({ offerId }) => {
      const offer = await getOfferById(offerId);
      return { offer };
    },
  }),
});
