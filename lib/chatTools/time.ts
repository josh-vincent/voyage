import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

export const timeTools: ToolFactory = (ctx) => ({
  currentDateTime: tool({
    description:
      'Get the current date and time in the user\'s local timezone. Call this whenever the user mentions relative dates like "tomorrow", "next week", "next month", "this weekend", or needs today\'s date to reason about availability.',
    inputSchema: z.object({}).describe('No arguments'),
    execute: async () => {
      const tz = ctx.timezone ?? 'UTC';
      const locale = ctx.locale ?? 'en-US';
      const iso = ctx.now.toISOString();
      let localFormatted = iso;
      try {
        localFormatted = new Intl.DateTimeFormat(locale, {
          timeZone: tz,
          dateStyle: 'full',
          timeStyle: 'short',
        }).format(ctx.now);
      } catch {
        // fall back to ISO
      }
      return {
        isoUtc: iso,
        date: ctx.now.toISOString().slice(0, 10),
        weekday: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(ctx.now),
        timezone: tz,
        local: localFormatted,
      };
    },
  }),

  relativeDate: tool({
    description:
      'Resolve a relative expression (like "next friday", "+14d", "this weekend") to an ISO date YYYY-MM-DD. Prefer this over guessing dates when the user phrases them loosely.',
    inputSchema: z.object({
      expression: z
        .string()
        .describe('Natural language or offset expression, e.g. "tomorrow", "+7d", "next friday", "2 weeks from now"'),
    }),
    execute: async ({ expression }) => {
      const d = resolveRelative(expression, ctx.now);
      return {
        expression,
        iso: d.toISOString().slice(0, 10),
        weekday: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(d),
      };
    },
  }),
});

function resolveRelative(expr: string, now: Date): Date {
  const s = expr.trim().toLowerCase();
  const d = new Date(now);
  if (s === 'today') return d;
  if (s === 'tomorrow') {
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (s === 'yesterday') {
    d.setDate(d.getDate() - 1);
    return d;
  }
  const off = s.match(/^([+-]?)(\d+)\s*([dwmy])/);
  if (off) {
    const sign = off[1] === '-' ? -1 : 1;
    const n = sign * parseInt(off[2], 10);
    const u = off[3];
    if (u === 'd') d.setDate(d.getDate() + n);
    else if (u === 'w') d.setDate(d.getDate() + n * 7);
    else if (u === 'm') d.setMonth(d.getMonth() + n);
    else if (u === 'y') d.setFullYear(d.getFullYear() + n);
    return d;
  }
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < weekdays.length; i++) {
    if (s.includes(weekdays[i])) {
      const current = d.getDay();
      let delta = (i - current + 7) % 7;
      if (delta === 0 || s.includes('next')) delta += 7;
      d.setDate(d.getDate() + delta);
      return d;
    }
  }
  if (s.includes('weekend')) {
    const current = d.getDay();
    const friday = (5 - current + 7) % 7;
    d.setDate(d.getDate() + (friday === 0 ? 7 : friday));
    return d;
  }
  return d;
}
