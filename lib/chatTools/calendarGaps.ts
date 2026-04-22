import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayOfWeek(d: Date): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

export const calendarGapTools: ToolFactory = (ctx) => ({
  findCalendarGaps: tool({
    description:
      'Find free windows in the traveler\'s local calendar. Use when the user asks "when am I free", "any gaps", "squeeze in a trip", "plan around my schedule". Returns contiguous day ranges with no scheduled commitments, ranked by length. Only usable when calendar access is granted — if access is denied, surface that to the user instead of guessing.',
    inputSchema: z.object({
      startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Inclusive start (YYYY-MM-DD). Defaults to today.'),
      endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe('Inclusive end (YYYY-MM-DD). Defaults to 90 days from today.'),
      minDurationDays: z
        .number()
        .int()
        .min(1)
        .max(30)
        .default(2)
        .describe('Ignore gaps shorter than this many days.'),
      weekendsOnly: z
        .boolean()
        .default(false)
        .describe('If true, only return gaps that include at least one Sat or Sun.'),
      maxResults: z.number().int().min(1).max(20).default(6),
    }),
    execute: async ({ startDate, endDate, minDurationDays, weekendsOnly, maxResults }) => {
      if (ctx.calendarAccess !== 'granted') {
        return {
          access: ctx.calendarAccess ?? 'unavailable',
          gaps: [],
          message:
            ctx.calendarAccess === 'denied'
              ? 'Calendar access is off — the user needs to enable it in Settings first.'
              : 'Calendar not yet connected on this device.',
        };
      }
      const today = startOfDay(ctx.now);
      const rangeStart = startDate ? startOfDay(new Date(startDate)) : today;
      const rangeEnd = endDate
        ? startOfDay(new Date(endDate))
        : startOfDay(new Date(today.getTime() + 90 * DAY_MS));
      if (rangeEnd.getTime() <= rangeStart.getTime()) {
        return { access: 'granted', gaps: [], message: 'Range is empty.' };
      }

      const events = (ctx.calendarEvents ?? [])
        .map((e) => ({
          start: startOfDay(new Date(e.start)),
          end: startOfDay(new Date(e.end)),
          title: e.title,
          allDay: e.allDay,
        }))
        .filter((e) => e.end.getTime() >= rangeStart.getTime() && e.start.getTime() <= rangeEnd.getTime())
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      const busyDays = new Set<number>();
      for (const e of events) {
        const endExclusive = e.allDay ? e.end.getTime() : e.end.getTime() + DAY_MS;
        for (let t = Math.max(e.start.getTime(), rangeStart.getTime()); t < endExclusive && t <= rangeEnd.getTime(); t += DAY_MS) {
          busyDays.add(t);
        }
      }

      type Gap = { start: string; end: string; days: number; includesWeekend: boolean };
      const gaps: Gap[] = [];
      let runStart: Date | null = null;
      let runDays = 0;
      for (let t = rangeStart.getTime(); t <= rangeEnd.getTime(); t += DAY_MS) {
        const day = new Date(t);
        if (!busyDays.has(t)) {
          if (!runStart) runStart = day;
          runDays++;
        } else if (runStart) {
          pushGap(runStart, runDays);
          runStart = null;
          runDays = 0;
        }
      }
      if (runStart) pushGap(runStart, runDays);

      function pushGap(start: Date, days: number) {
        if (days < minDurationDays) return;
        const endInclusive = new Date(start.getTime() + (days - 1) * DAY_MS);
        let includesWeekend = false;
        for (let i = 0; i < days; i++) {
          const d = new Date(start.getTime() + i * DAY_MS);
          const dow = d.getDay();
          if (dow === 0 || dow === 6) {
            includesWeekend = true;
            break;
          }
        }
        if (weekendsOnly && !includesWeekend) return;
        gaps.push({
          start: isoDate(start),
          end: isoDate(endInclusive),
          days,
          includesWeekend,
        });
      }

      gaps.sort((a, b) => b.days - a.days || a.start.localeCompare(b.start));
      const top = gaps.slice(0, maxResults).map((g) => ({
        ...g,
        startDay: dayOfWeek(new Date(g.start)),
        endDay: dayOfWeek(new Date(g.end)),
      }));

      return {
        access: 'granted',
        range: { start: isoDate(rangeStart), end: isoDate(rangeEnd) },
        totalEvents: events.length,
        gaps: top,
        message: top.length
          ? `Found ${top.length} free window${top.length === 1 ? '' : 's'}.`
          : 'No gaps of that size in the given range.',
      };
    },
  }),
});
