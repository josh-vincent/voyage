import { findAirport } from '@/lib/airports';
import type { StoredOrder } from '@/utils/trackedStorage';

export type ActiveTripStatus = 'upcoming' | 'in_progress';

export type ActiveTripDayMoment = {
  id: string;
  title: string;
  detail: string;
  tone: 'travel' | 'plan' | 'local';
};

export type ActiveTripDay = {
  index: number;
  title: string;
  label: string;
  dateLabel: string;
  summary: string;
  moments: ActiveTripDayMoment[];
};

export type ActiveTrip = {
  order: StoredOrder;
  tripId: string;
  status: ActiveTripStatus;
  departureAt: number;
  arrivalAt: number;
  routeLabel: string;
  headline: string;
  statusLabel: string;
  timingLabel: string;
  bookingLabel: string;
  destinationCity: string;
  originCity: string;
  days: ActiveTripDay[];
};

const UPCOMING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function getActiveTrip(orders: StoredOrder[], now = Date.now()): ActiveTrip | null {
  const active = orders
    .map((order) => buildActiveTrip(order, now))
    .filter((trip): trip is ActiveTrip => Boolean(trip));

  const inProgress = active
    .filter((trip) => trip.status === 'in_progress')
    .sort((a, b) => a.arrivalAt - b.arrivalAt)[0];

  if (inProgress) return inProgress;

  return (
    active
      .filter((trip) => trip.status === 'upcoming')
      .sort((a, b) => a.departureAt - b.departureAt)[0] ?? null
  );
}

export function buildActiveTrip(order: StoredOrder, now = Date.now()): ActiveTrip | null {
  const first = order.slices[0];
  const last = order.slices[order.slices.length - 1];
  if (!first || !last) return null;

  const departureAt = Date.parse(first.departing_at);
  const arrivalAt = Date.parse(last.arriving_at);
  if (!Number.isFinite(departureAt) || !Number.isFinite(arrivalAt)) return null;

  const qualifiesUpcoming = departureAt - now <= UPCOMING_WINDOW_MS && departureAt >= now;
  const inProgress = now >= departureAt && now <= arrivalAt;
  if (!qualifiesUpcoming && !inProgress) return null;

  const originCity = findAirport(first.origin)?.city ?? first.origin;
  const destinationCity = findAirport(last.destination)?.city ?? last.destination;
  const status: ActiveTripStatus = inProgress ? 'in_progress' : 'upcoming';

  return {
    order,
    tripId: order.id,
    status,
    departureAt,
    arrivalAt,
    routeLabel: `${first.origin} → ${last.destination}`,
    headline: `${originCity} to ${destinationCity}`,
    statusLabel: inProgress ? 'In progress now' : 'Upcoming journey',
    timingLabel: inProgress
      ? `Landed by ${formatTime(arrivalAt)}`
      : formatDepartureLabel(departureAt, now),
    bookingLabel: `Ref ${order.bookingReference}`,
    destinationCity,
    originCity,
    days: buildTripDays(order),
  };
}

export function getTripDayIndex(trip: ActiveTrip, now = Date.now()) {
  if (trip.days.length <= 1) return 0;

  const start = startOfDay(trip.departureAt);
  const current = startOfDay(now);
  const index = Math.round((current - start) / DAY_MS);

  return clamp(index, 0, trip.days.length - 1);
}

function buildTripDays(order: StoredOrder): ActiveTripDay[] {
  const first = order.slices[0];
  const last = order.slices[order.slices.length - 1];
  if (!first || !last) return [];

  const start = startOfDay(Date.parse(first.departing_at));
  const end = startOfDay(Date.parse(last.arriving_at));
  const totalDays = Math.max(1, Math.round((end - start) / DAY_MS) + 1);

  return Array.from({ length: totalDays }, (_, index) => {
    const date = start + index * DAY_MS;
    const isFirst = index === 0;
    const isLast = index === totalDays - 1;
    const airportMoments = order.slices
      .filter((slice) => startOfDay(Date.parse(slice.departing_at)) === date)
      .map((slice, sliceIndex) => ({
        id: `${index}-${sliceIndex}`,
        title: `${slice.origin} → ${slice.destination}`,
        detail: `${formatTime(Date.parse(slice.departing_at))} to ${formatTime(Date.parse(slice.arriving_at))} · ${slice.carrierName} ${slice.flightNumber}`,
        tone: 'travel' as const,
      }));

    const defaultMoments = isFirst
      ? [
          {
            id: `${index}-pack`,
            title: 'Departure window',
            detail: 'Keep passport, charger, and check-in details together before you leave.',
            tone: 'plan' as const,
          },
        ]
      : isLast
        ? [
            {
              id: `${index}-return`,
              title: 'Wrap the trip cleanly',
              detail: 'Leave buffer for airport transfer, receipts, and a final location check.',
              tone: 'plan' as const,
            },
          ]
        : [
            {
              id: `${index}-explore`,
              title: 'Anchor the day',
              detail:
                'Use this as the main day to explore the neighborhood and save places worth revisiting.',
              tone: 'local' as const,
            },
          ];

    const title = isFirst ? 'Departure day' : isLast ? 'Return day' : `Day ${index + 1}`;

    return {
      index,
      title,
      label: isFirst ? 'Takeoff' : isLast ? 'Return' : `Day ${index + 1}`,
      dateLabel: formatDate(date),
      summary: isFirst
        ? `Travel from ${findAirport(first.origin)?.city ?? first.origin} toward ${findAirport(last.destination)?.city ?? last.destination}.`
        : isLast
          ? `Close out ${findAirport(last.destination)?.city ?? last.destination} and head home with margin.`
          : `Set the pace for ${findAirport(last.destination)?.city ?? last.destination} without overloading the day.`,
      moments: [...airportMoments, ...defaultMoments],
    };
  });
}

function formatDepartureLabel(departureAt: number, now: number) {
  const diff = departureAt - now;
  const hours = Math.round(diff / (60 * 60 * 1000));
  if (hours <= 24) return `Departs in ${Math.max(hours, 1)}h · ${formatTime(departureAt)}`;

  const days = Math.ceil(diff / DAY_MS);
  if (days === 1) return `Departs tomorrow · ${formatMonthDay(departureAt)}`;
  return `Departs in ${days} days · ${formatMonthDay(departureAt)}`;
}

function formatMonthDay(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const DAY_MS = 24 * 60 * 60 * 1000;
