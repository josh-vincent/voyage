import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';
import { findAirport, AIRPORTS } from '@/lib/airports';

export const weatherTools: ToolFactory = (ctx) => ({
  weatherAt: tool({
    description:
      'Get a short weather forecast for a location on a given date (or today if omitted). Uses Open-Meteo (no key). Use when the user asks "what\'s the weather like", "will it rain", or wants packing advice.',
    inputSchema: z.object({
      location: z
        .string()
        .describe('IATA airport code (JFK) or city name (Tokyo). Resolved against the airports list.'),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Forecast date (YYYY-MM-DD). Up to 16 days out.'),
    }),
    execute: async ({ location, date }) => {
      const coords = resolveCoords(location);
      if (!coords) return { found: false, location };
      const target = date ?? ctx.now.toISOString().slice(0, 10);
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}` +
        `&longitude=${coords.lng}` +
        '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode' +
        `&start_date=${target}&end_date=${target}` +
        '&timezone=auto';
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
        const data: any = await res.json();
        const daily = data.daily;
        if (!daily?.time?.length) return { found: false, location, target };
        return {
          found: true,
          location: coords.label,
          date: daily.time[0],
          tempMaxC: daily.temperature_2m_max?.[0],
          tempMinC: daily.temperature_2m_min?.[0],
          precipMm: daily.precipitation_sum?.[0],
          summary: weatherCodeToText(daily.weathercode?.[0]),
        };
      } catch (e: any) {
        return { found: false, location, error: e?.message ?? 'Weather lookup failed' };
      }
    },
  }),
});

function resolveCoords(input: string): { lat: number; lng: number; label: string } | null {
  const direct = findAirport(input);
  if (direct) return { lat: direct.lat, lng: direct.lng, label: `${direct.city}, ${direct.country}` };
  const q = input.trim().toLowerCase();
  const city = AIRPORTS.find((a) => a.city.toLowerCase() === q || a.city.toLowerCase().includes(q));
  if (city) return { lat: city.lat, lng: city.lng, label: `${city.city}, ${city.country}` };
  return null;
}

function weatherCodeToText(code?: number): string {
  if (code === undefined) return 'Unknown';
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorms';
  return 'Mixed';
}
