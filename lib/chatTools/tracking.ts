import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

export const trackingTools: ToolFactory = (_ctx) => ({
  trackPrice: tool({
    description:
      'Propose a route for price tracking. The app renders a card with a "Track this" button that writes it to local storage. If you already searched this route and know the cheapest price, pass lastPrice + currency so the card can save without re-querying. Call this when the user says "watch", "track", "alert me", or "let me know if it drops".',
    inputSchema: z.object({
      origin: z.string().length(3),
      destination: z.string().length(3),
      departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      adults: z.number().int().min(1).max(9).default(1),
      cabin: z
        .enum(['economy', 'premium_economy', 'business', 'first'])
        .default('economy'),
      frequency: z.enum(['manual', 'daily', 'weekly']).default('daily'),
      lastPrice: z
        .number()
        .optional()
        .describe('Most recent price you observed, if you just searched. Numeric, no currency symbol.'),
      currency: z
        .string()
        .length(3)
        .optional()
        .describe('ISO 4217 currency for lastPrice.'),
      nickname: z.string().optional(),
    }),
    execute: async (args) => ({
      proposal: {
        origin: args.origin.toUpperCase(),
        destination: args.destination.toUpperCase(),
        departureDate: args.departureDate,
        returnDate: args.returnDate,
        adults: args.adults,
        cabin: args.cabin,
        frequency: args.frequency,
        lastPrice: args.lastPrice,
        currency: args.currency,
        nickname: args.nickname,
      },
      message: args.lastPrice
        ? `Ready to watch ${args.origin}→${args.destination} at ${args.currency ?? ''} ${args.lastPrice}. Tap Track to save it.`
        : `Ready to watch ${args.origin}→${args.destination}. Tap Track — I'll check current price and save it.`,
    }),
  }),
});
