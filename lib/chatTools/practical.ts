import { tool } from 'ai';
import { z } from 'zod';
import { airportCoord, haversineKm } from '@/lib/airportCoords';
import { cityCoord } from '@/lib/cityCoords';
import type { ToolFactory } from './types';

// Lightweight FX table — covers majors. Refresh once a month.
const FX_USD: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 156, AUD: 1.52, NZD: 1.66, CAD: 1.37,
  CHF: 0.91, CNY: 7.22, HKD: 7.83, SGD: 1.34, INR: 83.4, AED: 3.67, THB: 36.5,
  IDR: 16100, MYR: 4.7, PHP: 58.2, KRW: 1380, TWD: 32.5, MXN: 17.1, BRL: 5.07,
  ZAR: 18.6, NOK: 10.7, SEK: 10.7, DKK: 6.85, PLN: 4.02, CZK: 23.1, HUF: 365,
  TRY: 32.5, ILS: 3.7, ARS: 875, CLP: 950,
};

export const practicalTools: ToolFactory = (_ctx) => ({
  convertCurrency: tool({
    description:
      'Convert an amount between two currencies using a cached daily rate (offline-safe, not live FX). Use for "is $200 USD a good dinner price in Tokyo" or "how much is 50 euros in dollars".',
    inputSchema: z.object({
      amount: z.number().describe('Amount to convert'),
      from: z.string().length(3).describe('ISO 4217 source currency, e.g. USD'),
      to: z.string().length(3).describe('ISO 4217 target currency, e.g. JPY'),
    }),
    execute: async ({ amount, from, to }) => {
      const f = FX_USD[from.toUpperCase()];
      const t = FX_USD[to.toUpperCase()];
      if (!f || !t) {
        return { ok: false, message: `Don't have a rate for ${!f ? from : to}.` };
      }
      const usd = amount / f;
      const out = usd * t;
      return {
        ok: true,
        amount,
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        converted: Math.round(out * 100) / 100,
        rate: Math.round((t / f) * 1e6) / 1e6,
      };
    },
  }),

  distanceBetween: tool({
    description:
      'Distance and rough flight time between two cities or airports. Use for "how far is my hotel from CDG", "Bali to Tokyo distance", or "how long is the flight between X and Y".',
    inputSchema: z.object({
      a: z.string().describe('City name or IATA airport code'),
      b: z.string().describe('City name or IATA airport code'),
    }),
    execute: async ({ a, b }) => {
      const pa = airportCoord(a) ?? cityCoord(a);
      const pb = airportCoord(b) ?? cityCoord(b);
      if (!pa || !pb) {
        return { ok: false, message: `Don't have coordinates for ${!pa ? a : b}.` };
      }
      const km = haversineKm(pa, pb);
      const flightHours = Math.max(1, Math.round((km / 800) * 10) / 10); // ~800 km/h cruise
      return { ok: true, km: Math.round(km), flightHours };
    },
  }),

  findNearby: tool({
    description:
      "Suggest categories of nearby things from a base location. This is a generic local-knowledge helper — it does NOT call a live POI API. Use for \"what's near my hotel in Le Marais\" or \"food near JFK\". Returns common neighbourhood categories the user can act on.",
    inputSchema: z.object({
      base: z.string().describe('IATA airport code or city name'),
      categories: z
        .array(
          z.enum(['food', 'coffee', 'bar', 'museum', 'park', 'transit', 'shopping', 'pharmacy', 'atm'])
        )
        .optional()
        .describe('Which category types to surface; defaults to a general mix'),
    }),
    execute: async ({ base, categories }) => {
      const list = categories ?? ['food', 'coffee', 'museum', 'park', 'transit'];
      return {
        base,
        message: `For ${base}, recommend opening Apple Maps with each category — Voyage doesn't do live POI lookup yet. The user can also call thingsToDo for curated city ideas.`,
        suggestions: list.map((c) => ({ category: c, action: 'open Apple Maps' })),
      };
    },
  }),
});
