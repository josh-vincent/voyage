import { tool } from 'ai';
import { z } from 'zod';
import { searchStays } from '@/lib/duffelStays';
import { findAirport } from '@/lib/airports';
import type { ToolFactory } from './types';

export const stayTools: ToolFactory = (_ctx) => ({
  searchStays: tool({
    description:
      'Find accommodation (hotels, apartments, hostels, B&Bs, resorts) in a city. Use for "find me a hotel in Tokyo", "anywhere to stay in Lisbon next weekend", "cheap accommodation in Paris". Pair with reserveStay to take the user into the reservation flow.',
    inputSchema: z.object({
      city: z.string().describe('City name OR IATA code (e.g. "Paris" or "CDG")'),
      checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      guests: z.number().int().min(1).max(12).default(2),
      rooms: z.number().int().min(1).max(5).default(1),
      maxPricePerNight: z.number().optional(),
      propertyTypes: z
        .array(z.enum(['hotel', 'apartment', 'guesthouse', 'resort', 'hostel', 'bnb']))
        .optional(),
    }),
    execute: async ({ city, checkIn, checkOut, guests, rooms, maxPricePerNight, propertyTypes }) => {
      // searchStays (from duffelStays) is the Duffel-or-mock server function.
      // Coerce IATA → canonical iata for the coord lookup that happens inside.
      const airport = findAirport(city);
      const resolvedCity = airport?.city ?? city;
      let offers = await searchStays({ city: airport?.iata ?? city, checkIn, checkOut, guests, rooms });
      if (maxPricePerNight) offers = offers.filter((o) => o.pricePerNight <= maxPricePerNight);
      if (propertyTypes?.length) offers = offers.filter((o) => propertyTypes.includes(o.propertyType));
      return {
        city: resolvedCity,
        checkIn,
        checkOut,
        guests,
        rooms,
        count: offers.length,
        offers: offers.slice(0, 6).map((o) => ({
          id: o.id,
          name: o.name,
          propertyType: o.propertyType,
          neighborhood: o.neighborhood,
          pricePerNight: o.pricePerNight,
          totalAmount: o.totalAmount,
          currency: o.currency,
          rating: o.rating,
          reviewCount: o.reviewCount,
          amenities: o.amenities,
          cancellation: o.cancellation,
          distanceFromCenterKm: o.distanceFromCenterKm,
        })),
      };
    },
  }),
});
