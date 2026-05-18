// Shared day-skeleton generator. Used by both the chat tool
// (lib/chatTools/itinerary.ts) and the itinerary editor screen so the
// two surfaces produce identical scaffolds for the same input.

import { makeSlotId, type ItineraryDay } from './tripTypes';

export type SkeletonInput = {
  destination: string;
  startDate?: string;
  days: number;
  pace?: 'slow' | 'balanced' | 'packed';
  interests?: string[];
};

const ROTATING_THEMES = [
  'Orient yourself',
  'Go deep on culture',
  'Eat the city',
  'Nature / escape',
  'Off-map wander',
  'Rest + revisit',
];

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function buildItinerarySkeleton(input: SkeletonInput): ItineraryDay[] {
  const { days, destination, startDate, pace = 'balanced' } = input;
  const start = startDate || new Date().toISOString().slice(0, 10);
  return Array.from({ length: days }, (_, i) => {
    const isArrival = i === 0;
    const isDeparture = i === days - 1 && days > 1;
    const date = addDays(start, i);
    const theme = isArrival
      ? `Arrive in ${destination}`
      : isDeparture
        ? 'Slow morning + onward'
        : ROTATING_THEMES[(i - 1) % ROTATING_THEMES.length];
    return {
      date,
      theme,
      slots: defaultSlots({ isArrival, isDeparture, pace }),
    };
  });
}

function defaultSlots(opts: {
  isArrival: boolean;
  isDeparture: boolean;
  pace: 'slow' | 'balanced' | 'packed';
}): ItineraryDay['slots'] {
  if (opts.isArrival) {
    return [
      {
        id: makeSlotId('arr'),
        time: '15:00',
        kind: 'note',
        title: 'Land + settle in',
        detail: 'Drop bags, take a short walk to ground yourself.',
      },
      {
        id: makeSlotId('arr'),
        time: '19:30',
        kind: 'note',
        title: 'Easy first dinner',
        detail: 'Nothing ambitious. Save the appetite for tomorrow.',
      },
    ];
  }
  if (opts.isDeparture) {
    return [
      {
        id: makeSlotId('dep'),
        time: '09:30',
        kind: 'note',
        title: 'Slow morning · final coffee',
      },
      {
        id: makeSlotId('dep'),
        time: '12:30',
        kind: 'flight',
        title: 'Head to the airport',
        detail: 'Aim to arrive 90 minutes before your flight.',
      },
    ];
  }
  if (opts.pace === 'packed') {
    return [
      { id: makeSlotId('m'), time: '08:30', kind: 'note', title: 'Early breakfast spot' },
      { id: makeSlotId('m'), time: '10:00', kind: 'note', title: 'Morning sight' },
      { id: makeSlotId('a'), time: '13:00', kind: 'note', title: 'Lunch + neighbourhood' },
      { id: makeSlotId('a'), time: '15:30', kind: 'note', title: 'Afternoon culture' },
      { id: makeSlotId('e'), time: '19:30', kind: 'note', title: 'Dinner' },
      { id: makeSlotId('e'), time: '22:00', kind: 'note', title: 'Drinks' },
    ];
  }
  if (opts.pace === 'slow') {
    return [
      { id: makeSlotId('m'), time: '10:30', kind: 'note', title: 'Late breakfast walk' },
      { id: makeSlotId('a'), time: '16:00', kind: 'note', title: 'One thing — well chosen' },
      { id: makeSlotId('e'), time: '20:00', kind: 'note', title: 'Long dinner' },
    ];
  }
  return [
    { id: makeSlotId('m'), time: '09:30', kind: 'note', title: 'Morning · pick one thing' },
    { id: makeSlotId('a'), time: '13:00', kind: 'note', title: 'Lunch + neighbourhood' },
    { id: makeSlotId('a'), time: '15:30', kind: 'note', title: 'Afternoon · one thing' },
    { id: makeSlotId('e'), time: '19:30', kind: 'note', title: 'Dinner' },
  ];
}
