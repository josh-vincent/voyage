import { Linking, Platform, Alert } from 'react-native';
import * as Calendar from 'expo-calendar';

export type CalendarEvent = {
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  notes?: string;
  url?: string;
};

function toGCalDate(iso: string, allDay: boolean): string {
  const d = new Date(iso);
  if (allDay) {
    return [d.getUTCFullYear(), String(d.getUTCMonth() + 1).padStart(2, '0'), String(d.getUTCDate()).padStart(2, '0')].join('');
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const allDay = !!e.allDay;
  const dates = `${toGCalDate(e.start, allDay)}/${toGCalDate(e.end, allDay)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates,
  });
  if (e.location) params.append('location', e.location);
  if (e.notes || e.url) {
    const details = [e.notes, e.url].filter(Boolean).join('\n\n');
    params.append('details', details);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function openAllInGoogleCalendar(events: CalendarEvent[]) {
  if (!events.length) return;
  await Linking.openURL(googleCalendarUrl(events[0]));
  for (let i = 1; i < events.length; i++) {
    await new Promise((r) => setTimeout(r, 400));
    await Linking.openURL(googleCalendarUrl(events[i]));
  }
}

async function ensureDefaultCalendarId(): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  if (Platform.OS === 'ios') {
    const def = await Calendar.getDefaultCalendarAsync();
    if (def?.id) return def.id;
  }
  const writable = calendars.find((c) => c.allowsModifications && c.source);
  return writable?.id ?? calendars[0]?.id ?? null;
}

export type BusyEvent = {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
};

export async function readDeviceCalendar(
  startISO: string,
  endISO: string,
): Promise<{ status: 'granted' | 'denied' | 'undetermined'; events: BusyEvent[] }> {
  const perm = await Calendar.getCalendarPermissionsAsync();
  let status = perm.status;
  if (status !== 'granted') {
    const req = await Calendar.requestCalendarPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return { status: status as any, events: [] };
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const ids = cals.map((c) => c.id);
  if (!ids.length) return { status: 'granted', events: [] };
  const raw = await Calendar.getEventsAsync(ids, new Date(startISO), new Date(endISO));
  const events: BusyEvent[] = raw
    .filter((e) => !!e.startDate && !!e.endDate)
    .map((e) => ({
      title: e.title ?? 'Busy',
      start: new Date(e.startDate as any).toISOString(),
      end: new Date(e.endDate as any).toISOString(),
      allDay: !!e.allDay,
    }));
  return { status: 'granted', events };
}

export async function saveToDeviceCalendar(events: CalendarEvent[]): Promise<number> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Calendar access needed', 'Enable calendar permission in Settings to save events.');
    return 0;
  }
  const calendarId = await ensureDefaultCalendarId();
  if (!calendarId) {
    Alert.alert('No writable calendar', 'Couldn\'t find a calendar to save to.');
    return 0;
  }
  let saved = 0;
  for (const e of events) {
    try {
      await Calendar.createEventAsync(calendarId, {
        title: e.title,
        startDate: new Date(e.start),
        endDate: new Date(e.end),
        allDay: !!e.allDay,
        location: e.location,
        notes: [e.notes, e.url].filter(Boolean).join('\n\n') || undefined,
      });
      saved++;
    } catch (err) {
      console.warn('calendar create failed', err);
    }
  }
  if (saved > 0) {
    Alert.alert('Saved', `${saved} event${saved > 1 ? 's' : ''} added to your calendar.`);
  }
  return saved;
}
