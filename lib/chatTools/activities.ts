import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';
import { findAirport } from '@/lib/airports';

type Activity = {
  title: string;
  area: string;
  kind: 'food' | 'culture' | 'outdoors' | 'nightlife' | 'view' | 'shopping';
  priceLevel: 1 | 2 | 3;
  when: string;
};

const CITY_ACTIVITIES: Record<string, Activity[]> = {
  'New York': [
    { title: 'Coffee crawl in the West Village', area: 'Manhattan', kind: 'food', priceLevel: 2, when: 'morning' },
    { title: 'Brooklyn Bridge sunset walk', area: 'Brooklyn', kind: 'view', priceLevel: 1, when: 'evening' },
    { title: 'MoMA late hours', area: 'Midtown', kind: 'culture', priceLevel: 2, when: 'late afternoon' },
    { title: 'Dive bar hop on the LES', area: 'Lower East Side', kind: 'nightlife', priceLevel: 2, when: 'night' },
  ],
  'Los Angeles': [
    { title: 'Pacific Coast Highway drive to Malibu', area: 'Coast', kind: 'outdoors', priceLevel: 2, when: 'afternoon' },
    { title: 'Griffith Observatory at dusk', area: 'Griffith', kind: 'view', priceLevel: 1, when: 'evening' },
    { title: 'Grand Central Market tasting', area: 'Downtown', kind: 'food', priceLevel: 2, when: 'lunch' },
    { title: 'Venice canals + Abbot Kinney', area: 'Venice', kind: 'shopping', priceLevel: 2, when: 'afternoon' },
  ],
  'London': [
    { title: 'Borough Market brunch', area: 'Bankside', kind: 'food', priceLevel: 2, when: 'morning' },
    { title: 'Tate Modern + Millennium Bridge', area: 'South Bank', kind: 'culture', priceLevel: 1, when: 'afternoon' },
    { title: 'Primrose Hill sunset picnic', area: 'Camden', kind: 'view', priceLevel: 1, when: 'evening' },
    { title: 'Soho tiny-restaurant crawl', area: 'Soho', kind: 'food', priceLevel: 3, when: 'night' },
  ],
  'Paris': [
    { title: 'Bakery breakfast on Rue Cler', area: '7th', kind: 'food', priceLevel: 2, when: 'morning' },
    { title: 'Musée d\'Orsay at opening', area: '7th', kind: 'culture', priceLevel: 2, when: 'morning' },
    { title: 'Canal Saint-Martin apéro', area: '10th', kind: 'food', priceLevel: 2, when: 'evening' },
    { title: 'Montmartre after dark', area: '18th', kind: 'view', priceLevel: 1, when: 'night' },
  ],
  'Tokyo': [
    { title: 'Tsukiji outer market sushi breakfast', area: 'Tsukiji', kind: 'food', priceLevel: 2, when: 'morning' },
    { title: 'teamLab Planets', area: 'Toyosu', kind: 'culture', priceLevel: 2, when: 'afternoon' },
    { title: 'Shibuya crossing + Nonbei Yokocho', area: 'Shibuya', kind: 'nightlife', priceLevel: 2, when: 'night' },
    { title: 'Yanaka Ginza quiet wander', area: 'Yanaka', kind: 'outdoors', priceLevel: 1, when: 'afternoon' },
  ],
  'Lisbon': [
    { title: 'Miradouro da Graça sunset', area: 'Graça', kind: 'view', priceLevel: 1, when: 'evening' },
    { title: 'Tram 28 ride', area: 'Alfama', kind: 'outdoors', priceLevel: 1, when: 'morning' },
    { title: 'Pastéis in Belém', area: 'Belém', kind: 'food', priceLevel: 1, when: 'afternoon' },
    { title: 'Bairro Alto late-night bars', area: 'Bairro Alto', kind: 'nightlife', priceLevel: 2, when: 'night' },
  ],
  'Rome': [
    { title: 'Early Colosseum with guide', area: 'Centre', kind: 'culture', priceLevel: 2, when: 'morning' },
    { title: 'Trastevere dinner crawl', area: 'Trastevere', kind: 'food', priceLevel: 2, when: 'night' },
    { title: 'Aventine keyhole + Rose garden', area: 'Aventine', kind: 'view', priceLevel: 1, when: 'afternoon' },
  ],
  'Barcelona': [
    { title: 'Sagrada Família timed entry', area: 'Eixample', kind: 'culture', priceLevel: 2, when: 'morning' },
    { title: 'Tapas tour in El Born', area: 'El Born', kind: 'food', priceLevel: 2, when: 'evening' },
    { title: 'Bunkers del Carmel sunset', area: 'El Carmel', kind: 'view', priceLevel: 1, when: 'evening' },
  ],
  'Amsterdam': [
    { title: 'Canal bike loop', area: 'Centre', kind: 'outdoors', priceLevel: 2, when: 'morning' },
    { title: 'Foodhallen lunch', area: 'Oud-West', kind: 'food', priceLevel: 2, when: 'lunch' },
    { title: 'Van Gogh Museum', area: 'Museumplein', kind: 'culture', priceLevel: 2, when: 'afternoon' },
  ],
  'Dubai': [
    { title: 'Old Dubai souks + abra crossing', area: 'Deira', kind: 'shopping', priceLevel: 1, when: 'morning' },
    { title: 'Dune drive at golden hour', area: 'Desert', kind: 'outdoors', priceLevel: 3, when: 'evening' },
    { title: 'Burj Khalifa at the top', area: 'Downtown', kind: 'view', priceLevel: 3, when: 'sunset' },
  ],
  'Singapore': [
    { title: 'Hawker crawl at Maxwell', area: 'Chinatown', kind: 'food', priceLevel: 1, when: 'lunch' },
    { title: 'Gardens by the Bay at night', area: 'Marina', kind: 'view', priceLevel: 2, when: 'night' },
    { title: 'Tiong Bahru indie cafés', area: 'Tiong Bahru', kind: 'food', priceLevel: 2, when: 'morning' },
  ],
  'Sydney': [
    { title: 'Bondi to Coogee coastal walk', area: 'East', kind: 'outdoors', priceLevel: 1, when: 'morning' },
    { title: 'Opera Bar at sunset', area: 'Circular Quay', kind: 'view', priceLevel: 2, when: 'evening' },
    { title: 'Chinatown yum cha', area: 'CBD', kind: 'food', priceLevel: 2, when: 'lunch' },
  ],
};

function resolveCity(query: string): string | null {
  if (CITY_ACTIVITIES[query]) return query;
  const q = query.trim();
  const byIata = findAirport(q);
  if (byIata && CITY_ACTIVITIES[byIata.city]) return byIata.city;
  const ci = Object.keys(CITY_ACTIVITIES).find((c) => c.toLowerCase() === q.toLowerCase());
  return ci ?? null;
}

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
      const resolved = resolveCity(city);
      if (!resolved) {
        return {
          city,
          found: false,
          message: 'No curated activities yet for this city. Suggest searching online.',
        };
      }
      let list = CITY_ACTIVITIES[resolved];
      if (kinds?.length) list = list.filter((a) => kinds.includes(a.kind));
      if (maxPrice) list = list.filter((a) => a.priceLevel <= maxPrice);
      return { city: resolved, found: true, activities: list };
    },
  }),
});
