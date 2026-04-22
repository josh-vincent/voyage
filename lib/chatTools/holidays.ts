import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

type NagerHoliday = {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  types: string[];
};

function dayOfWeek(iso: string): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(iso + 'T00:00:00Z').getUTCDay()];
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function longWeekendSuggestion(iso: string): { from: string; to: string; dayOffNeeded?: string } | null {
  const dow = new Date(iso + 'T00:00:00Z').getUTCDay();
  if (dow === 1) return { from: addDays(iso, -2), to: iso };
  if (dow === 5) return { from: iso, to: addDays(iso, 2) };
  if (dow === 4) return { from: iso, to: addDays(iso, 3), dayOffNeeded: 'Friday' };
  if (dow === 2) return { from: addDays(iso, -3), to: iso, dayOffNeeded: 'Monday' };
  return null;
}

async function fetchHolidays(year: number, countryCode: string): Promise<NagerHoliday[]> {
  const res = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode.toUpperCase()}`,
  );
  if (!res.ok) throw new Error(`Nager: ${res.status}`);
  return (await res.json()) as NagerHoliday[];
}

export const holidayTools: ToolFactory = (ctx) => ({
  publicHolidays: tool({
    description:
      'Fetch upcoming public holidays for a country. Use when the user mentions "public holiday", "bank holiday", "long weekend", "day off", or wants to pad a weekend with a holiday. Pair with findCalendarGaps (to confirm they\'re free) and searchFlights (to propose a trip).',
    inputSchema: z.object({
      countryCode: z
        .string()
        .length(2)
        .optional()
        .describe('ISO 3166-1 alpha-2 (US, GB, AU, FR…). Defaults to the user\'s country.'),
      year: z
        .number()
        .int()
        .min(2000)
        .max(2100)
        .optional()
        .describe('4-digit year. Defaults to the current year; auto-includes next year when today is in the last 60 days.'),
      upcomingOnly: z
        .boolean()
        .default(true)
        .describe('If true, only return holidays on or after today.'),
      longWeekendsOnly: z
        .boolean()
        .default(false)
        .describe('If true, only return holidays that fall on Mon/Fri/Thu/Tue (good long-weekend candidates).'),
      maxResults: z.number().int().min(1).max(20).default(8),
    }),
    execute: async ({ countryCode, year, upcomingOnly, longWeekendsOnly, maxResults }) => {
      const cc = (countryCode ?? ctx.countryCode ?? 'US').toUpperCase();
      const now = ctx.now;
      const todayISO = now.toISOString().slice(0, 10);
      const years: number[] = [];
      if (year) {
        years.push(year);
      } else {
        years.push(now.getUTCFullYear());
        const daysUntilYearEnd =
          (Date.UTC(now.getUTCFullYear() + 1, 0, 1) - now.getTime()) / (24 * 3600 * 1000);
        if (daysUntilYearEnd < 60) years.push(now.getUTCFullYear() + 1);
      }

      let all: NagerHoliday[] = [];
      try {
        for (const y of years) {
          const got = await fetchHolidays(y, cc);
          all = all.concat(got);
        }
      } catch (e: any) {
        return {
          countryCode: cc,
          holidays: [],
          message: `Couldn\'t fetch holidays for ${cc}: ${e?.message ?? 'network error'}`,
        };
      }

      let filtered = all;
      if (upcomingOnly) filtered = filtered.filter((h) => h.date >= todayISO);
      if (longWeekendsOnly) {
        filtered = filtered.filter((h) => {
          const dow = new Date(h.date + 'T00:00:00Z').getUTCDay();
          return dow === 1 || dow === 2 || dow === 4 || dow === 5;
        });
      }
      filtered.sort((a, b) => a.date.localeCompare(b.date));
      const top = filtered.slice(0, maxResults).map((h) => ({
        date: h.date,
        dayOfWeek: dayOfWeek(h.date),
        name: h.localName,
        englishName: h.name,
        global: h.global,
        longWeekend: longWeekendSuggestion(h.date),
      }));

      return {
        countryCode: cc,
        count: top.length,
        holidays: top,
        message: top.length
          ? `Next ${top.length} ${longWeekendsOnly ? 'long-weekend candidates' : 'holidays'} in ${cc}.`
          : `No holidays found for ${cc} with those filters.`,
      };
    },
  }),
});
