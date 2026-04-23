import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { buildTools, type VoyageContext } from '@/lib/chatTools/registry';
import type {
  TripSummary,
  WatchedRouteSummary,
  CalendarEventSummary,
  CalendarAccess,
} from '@/lib/chatTools/types';
import { getGatewayKey, getGatewayModel, jsonError } from './_env';

const BASE_SYSTEM_PROMPT = `You are Voyage — a personal holiday concierge, not a generic booking tool.
Voice: warm, concise, quietly excited about travel. Use short sentences and Markdown (**bold**, lists) to make things scannable on mobile.

How you help:
- Finding good-value flights, weekend escapes, beach resets, and city breaks.
- Watching prices so the user doesn't have to refresh.
- Drafting loose itineraries, things to do, packing ideas.

Behaviour rules:
- Before reasoning about any "tomorrow / next week / this month" reference, call currentDateTime so you're grounded.
- When the user omits an origin, call userLocation to pick up their home airport before searchFlights.
- For flights, always call searchFlights — don't guess prices.
- For "watch", "track", "alert me", "let me know if it drops", call trackPrice. If you just ran searchFlights and have a price in hand, pass lastPrice and currency to trackPrice so the user can save it in one tap.
- When the user references a trip they already booked ("my LA flight", "open my Tokyo trip", "when does my next one leave"), call openTrip. Use the booking references in the context when you know them.
- For "what should I do in X" or "ideas for Y", call thingsToDo.
- For packing / weather questions, call weatherAt.
- For "do I need a visa / adapter / what currency", call countryInfo.
- For multi-day plans, call planItinerary.
- When the user says "add to calendar", "save to my calendar", or has just booked/planned something concrete — call addToCalendar with proper ISO start/end times. For flights, create one event per leg titled like "Flight: JFK → NRT (JL5)". For itinerary days, create one all-day event per day. Always include a sensible end time (flights: use arrival time; activities: +2h; all-day: same day).
- For "when am I free", "any gaps", "squeeze in a trip", "plan around my schedule" — call findCalendarGaps. Then feel free to chain into searchFlights for the gap you pick.
- For "public holiday", "bank holiday", "long weekend", "day off to extend" — call publicHolidays. If the user wants a long weekend, pass longWeekendsOnly: true; cross-reference with findCalendarGaps if you need to confirm they're free, and chain into searchFlights to propose an escape.
- You may call several tools in sequence — it's fine.
- Summarise offers by airline, price, stops, and depart time — never dump raw JSON.
- Keep each reply under ~5 short lines unless the user wants depth.
- Dates are ISO YYYY-MM-DD.`;

function buildContextSuffix(ctx: {
  upcomingTrips?: TripSummary[];
  watchedRoutes?: WatchedRouteSummary[];
  calendarAccess?: CalendarAccess;
  calendarRange?: { start: string; end: string };
  calendarEvents?: CalendarEventSummary[];
  countryCode?: string;
}): string {
  const lines: string[] = [];
  if (ctx.upcomingTrips?.length) {
    lines.push('Known upcoming trips (use these for openTrip):');
    for (const t of ctx.upcomingTrips.slice(0, 6)) {
      const date = t.departingAt?.slice(0, 10);
      const flight = [t.carrierName, t.flightNumber].filter(Boolean).join(' ');
      lines.push(
        `- ${t.bookingReference} · ${t.origin}→${t.destination} · ${date ?? 'TBD'}${flight ? ` · ${flight}` : ''}`,
      );
    }
  }
  if (ctx.watchedRoutes?.length) {
    lines.push('Routes the user is already watching:');
    for (const r of ctx.watchedRoutes.slice(0, 6)) {
      lines.push(
        `- ${r.origin}→${r.destination} · ${r.departureDate}${r.returnDate ? `–${r.returnDate}` : ''} · ${r.currency} ${Math.round(r.lastPrice)}`,
      );
    }
  }
  if (ctx.calendarAccess === 'granted') {
    const n = ctx.calendarEvents?.length ?? 0;
    const r = ctx.calendarRange;
    lines.push(
      `Calendar access: granted · ${n} event${n === 1 ? '' : 's'} loaded${r ? ` (${r.start} → ${r.end})` : ''}. Use findCalendarGaps when gaps are relevant.`,
    );
  } else if (ctx.calendarAccess === 'denied') {
    lines.push('Calendar access: denied — findCalendarGaps will return an access-denied result; ask the user to enable it in Settings.');
  }
  if (ctx.countryCode) {
    lines.push(`User country (for publicHolidays default): ${ctx.countryCode}`);
  }
  return lines.length ? `\n\nUser state:\n${lines.join('\n')}` : '';
}

type IncomingBody = {
  messages?: UIMessage[];
  userContext?: {
    homeAirport?: string;
    timezone?: string;
    coords?: { lat: number; lon: number };
    countryCode?: string;
    city?: string;
    locale?: string;
    upcomingTrips?: TripSummary[];
    watchedRoutes?: WatchedRouteSummary[];
    calendarAccess?: CalendarAccess;
    calendarEvents?: CalendarEventSummary[];
    calendarRange?: { start: string; end: string };
  };
};

export async function POST(request: Request) {
  let apiKey: string;
  let gatewayModel: string;
  try {
    apiKey = getGatewayKey();
    gatewayModel = getGatewayModel();
  } catch (e: any) {
    return jsonError(500, e?.message ?? 'AI Gateway not configured');
  }
  process.env.AI_GATEWAY_API_KEY = apiKey;

  let body: IncomingBody;
  try {
    body = (await request.json()) as IncomingBody;
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }
  if (!Array.isArray(body.messages)) {
    return jsonError(400, 'messages[] required');
  }

  const ctx: VoyageContext = {
    now: new Date(),
    homeAirport: body.userContext?.homeAirport,
    timezone: body.userContext?.timezone,
    coords: body.userContext?.coords,
    countryCode: body.userContext?.countryCode,
    city: body.userContext?.city,
    locale: body.userContext?.locale,
    upcomingTrips: body.userContext?.upcomingTrips,
    watchedRoutes: body.userContext?.watchedRoutes,
    calendarAccess: body.userContext?.calendarAccess,
    calendarEvents: body.userContext?.calendarEvents,
    calendarRange: body.userContext?.calendarRange,
  };

  const system = BASE_SYSTEM_PROMPT + buildContextSuffix(ctx);

  try {
    const result = streamText({
      model: gatewayModel,
      system,
      messages: convertToModelMessages(body.messages),
      tools: buildTools(ctx),
      stopWhen: stepCountIs(8),
    });
    return result.toUIMessageStreamResponse();
  } catch (e: any) {
    return jsonError(500, e?.message ?? 'Chat stream failed');
  }
}
