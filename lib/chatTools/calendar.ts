import { tool } from 'ai';
import { z } from 'zod';
import type { ToolFactory } from './types';

const eventSchema = z.object({
  title: z.string().min(1),
  start: z.string().describe('ISO 8601 datetime, e.g. 2026-05-03T07:30:00'),
  end: z.string().describe('ISO 8601 datetime'),
  allDay: z.boolean().default(false),
  location: z.string().optional(),
  notes: z.string().optional(),
  url: z.string().optional(),
});

export const calendarTools: ToolFactory = (ctx) => ({
  addToCalendar: tool({
    description:
      'Propose one or more events to add to the traveler\'s calendar (flights, hotel check-ins, itinerary days, activities). The client renders buttons so the user can save them to iOS Calendar or Google Calendar. Use ISO 8601 local times. Prefer concrete titles like "Flight: JFK → NRT (JL5)" over vague labels.',
    inputSchema: z.object({
      summary: z.string().describe('One-line summary to show above the event list, e.g. "Your Lisbon trip"'),
      timezone: z.string().optional().describe('IANA timezone, e.g. Europe/Lisbon'),
      events: z.array(eventSchema).min(1).max(20),
    }),
    execute: async ({ summary, timezone, events }) => ({
      summary,
      timezone: timezone ?? ctx.timezone,
      events: events.map((e) => ({ ...e, allDay: e.allDay ?? false })),
    }),
  }),
});
