// Dev-only seed data. Called once from app/_layout.tsx inside a __DEV__
// guard. Idempotent — only writes when an AsyncStorage key is absent or
// empty. Never overwrites real user data.
//
// Exposes resetDevData() for use from the dev "Reset demo data" control.

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StoredOrder } from '@/utils/trackedStorage';
import { saveOrder, saveTracked, saveTripCompanionSession, addRecent } from '@/utils/trackedStorage';
import {
  saveTrip,
  upsertTripFromOrder,
  ensureItineraryDays,
  linkStayToTrip,
  linkActivityToTrip,
  addItinerarySlot,
} from '@/utils/tripStorage';
import { saveStay, addRecentStaySearch } from '@/utils/staysStorage';
import { saveActivity } from '@/utils/discoverStorage';
import { addNotification, setAllNotifications } from '@/utils/notificationsStorage';
import { setAllPaymentMethods } from '@/utils/paymentMethodsStorage';
import { setAllProfiles } from '@/utils/travelerProfileStorage';
import type { TravelerProfile } from '@/lib/travelerProfileTypes';
import type { TrackedRoute } from '@/lib/flightTypes';
import type { SavedStay } from '@/lib/stayTypes';
import type { Trip } from '@/lib/tripTypes';
import type { Activity } from '@/lib/discover';
import { getCityActivities } from '@/lib/discover';
import { saveChat, type StoredChat, type StoredChatMessage } from '@/lib/chatStorage';

const DAY = 86_400_000;
const STORAGE_KEYS = [
  '@voyage/tracked',
  '@voyage/orders',
  '@voyage/trips',
  '@voyage/saved-stays',
  '@voyage/saved-activities',
  '@voyage/recent-searches',
  '@voyage/recent-stay-searches',
  '@voyage/chats',
  '@voyage/notifications',
  '@voyage/payment-methods',
  '@voyage/trip-companion',
  '@voyage/traveler-profiles',
];

function iso(daysFromNow: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function isoDate(daysFromNow: number): string {
  return iso(daysFromNow).slice(0, 10);
}

async function isEmpty(key: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return true;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length === 0;
    if (parsed && typeof parsed === 'object') return Object.keys(parsed).length === 0;
    return false;
  } catch {
    return true;
  }
}

// ─── TRACKED ROUTES ────────────────────────────────────────────────────
function makeTrackedSeeds(): TrackedRoute[] {
  const now = Date.now();
  return [
    {
      id: 'JFK-NRT-2026-08-12-2026-08-22-1-economy',
      origin: 'JFK',
      destination: 'NRT',
      departureDate: isoDate(60),
      returnDate: isoDate(70),
      adults: 1,
      cabin: 'economy',
      lastPrice: 712,
      currency: 'USD',
      lastCheckedAt: now,
      createdAt: now - 18 * DAY,
      scanFrequency: 'daily',
      lowestPrice: 712,
      nickname: 'Tokyo summer',
      history: [
        { price: 854, at: now - 18 * DAY },
        { price: 832, at: now - 14 * DAY },
        { price: 798, at: now - 11 * DAY },
        { price: 781, at: now - 8 * DAY },
        { price: 745, at: now - 5 * DAY },
        { price: 728, at: now - 3 * DAY },
        { price: 712, at: now - 1 * DAY },
      ],
    },
    {
      id: 'SFO-CDG-2026-06-10-2026-06-18-2-economy',
      origin: 'SFO',
      destination: 'CDG',
      departureDate: isoDate(30),
      returnDate: isoDate(38),
      adults: 2,
      cabin: 'economy',
      lastPrice: 612,
      currency: 'USD',
      lastCheckedAt: now,
      createdAt: now - 22 * DAY,
      scanFrequency: 'daily',
      lowestPrice: 598,
      nickname: 'Paris with the team',
      bookedOrderId: 'order-paris-june',
      history: [
        { price: 624, at: now - 22 * DAY },
        { price: 618, at: now - 18 * DAY },
        { price: 605, at: now - 14 * DAY },
        { price: 598, at: now - 10 * DAY },
        { price: 612, at: now - 6 * DAY },
        { price: 612, at: now - 2 * DAY },
      ],
    },
    {
      id: 'LAX-LHR-2026-09-04-2026-09-14-1-business',
      origin: 'LAX',
      destination: 'LHR',
      departureDate: isoDate(85),
      returnDate: isoDate(95),
      adults: 1,
      cabin: 'business',
      lastPrice: 2940,
      currency: 'USD',
      lastCheckedAt: now,
      createdAt: now - 30 * DAY,
      scanFrequency: 'weekly',
      lowestPrice: 2510,
      nickname: 'London business · maybe',
      history: [
        { price: 2510, at: now - 30 * DAY },
        { price: 2575, at: now - 24 * DAY },
        { price: 2680, at: now - 18 * DAY },
        { price: 2780, at: now - 12 * DAY },
        { price: 2880, at: now - 6 * DAY },
        { price: 2940, at: now - 1 * DAY },
      ],
    },
  ];
}

// ─── ORDERS ────────────────────────────────────────────────────────────
function makeOrderSeeds(): StoredOrder[] {
  const now = Date.now();
  return [
    {
      id: 'order-paris-june',
      bookingReference: 'VOY7A2X',
      totalAmount: '612.00',
      totalCurrency: 'USD',
      passengerName: 'Alex Morgan',
      createdAt: now - 6 * DAY,
      trackedId: 'SFO-CDG-2026-06-10-2026-06-18-2-economy',
      slices: [
        {
          origin: 'SFO',
          destination: 'CDG',
          departing_at: iso(30, 18, 30),
          arriving_at: iso(31, 14, 5),
          carrierName: 'Atlas Air',
          carrierCode: 'AT',
          flightNumber: '288',
        },
        {
          origin: 'CDG',
          destination: 'SFO',
          departing_at: iso(38, 11, 25),
          arriving_at: iso(38, 14, 45),
          carrierName: 'Atlas Air',
          carrierCode: 'AT',
          flightNumber: '289',
        },
      ],
    },
    {
      id: 'order-miami-now',
      bookingReference: 'VOY3M9K',
      totalAmount: '328.00',
      totalCurrency: 'USD',
      passengerName: 'Alex Morgan',
      createdAt: now - 14 * DAY,
      slices: [
        {
          origin: 'JFK',
          destination: 'MIA',
          departing_at: iso(0, 8, 15),
          arriving_at: iso(0, 11, 40),
          carrierName: 'Northstar',
          carrierCode: 'NS',
          flightNumber: '412',
        },
        {
          origin: 'MIA',
          destination: 'JFK',
          departing_at: iso(2, 17, 50),
          arriving_at: iso(2, 20, 55),
          carrierName: 'Northstar',
          carrierCode: 'NS',
          flightNumber: '417',
        },
      ],
    },
    {
      id: 'order-lisbon-past',
      bookingReference: 'VOY1L8B',
      totalAmount: '486.00',
      totalCurrency: 'USD',
      passengerName: 'Alex Morgan',
      createdAt: now - 60 * DAY,
      slices: [
        {
          origin: 'JFK',
          destination: 'LIS',
          departing_at: iso(-32, 20, 10),
          arriving_at: iso(-31, 8, 45),
          carrierName: 'Voyage Connect',
          carrierCode: 'VY',
          flightNumber: '601',
        },
        {
          origin: 'LIS',
          destination: 'JFK',
          departing_at: iso(-24, 12, 0),
          arriving_at: iso(-24, 15, 30),
          carrierName: 'Voyage Connect',
          carrierCode: 'VY',
          flightNumber: '602',
        },
      ],
    },
  ];
}

// ─── SAVED STAYS ───────────────────────────────────────────────────────
function makeStaySeeds(): Array<{ stay: SavedStay; tripId?: string }> {
  const now = Date.now();
  return [
    {
      stay: {
        id: 'CDG|2026-06-10|2026-06-18|2|1|seed-stay-paris',
        offerId: 'mock_stay_CDG_seed_paris',
        name: 'The Parchment Inn',
        city: 'CDG',
        cityName: 'Paris',
        neighborhood: 'Le Marais',
        checkIn: isoDate(30),
        checkOut: isoDate(38),
        guests: 2,
        rooms: 1,
        totalAmount: 1248,
        pricePerNight: 156,
        currency: 'USD',
        rating: 4.6,
        propertyType: 'guesthouse',
        amenities: ['wifi', 'breakfast', 'pet_friendly'],
        cancellation: 'free',
        savedAt: now - 5 * DAY,
        status: 'booked',
        bookingReference: 'VST4821',
        leadGuestName: 'Alex Morgan',
        bookedAt: now - 5 * DAY,
      },
      tripId: 'trip-order-paris-june',
    },
    {
      stay: {
        id: 'MIA|now|now+2|1|1|seed-stay-miami',
        offerId: 'mock_stay_MIA_seed_miami',
        name: 'Atlas House',
        city: 'MIA',
        cityName: 'Miami',
        neighborhood: 'South Beach',
        checkIn: isoDate(0),
        checkOut: isoDate(2),
        guests: 1,
        rooms: 1,
        totalAmount: 412,
        pricePerNight: 206,
        currency: 'USD',
        rating: 4.4,
        propertyType: 'hotel',
        amenities: ['wifi', 'breakfast', 'gym', 'ac', 'workspace'],
        cancellation: 'free',
        savedAt: now - 13 * DAY,
        status: 'booked',
        bookingReference: 'VST5907',
        leadGuestName: 'Alex Morgan',
        bookedAt: now - 13 * DAY,
      },
      tripId: 'trip-order-miami-now',
    },
    {
      stay: {
        id: 'NRT|wishlist|2026-08|2|1|seed-stay-tokyo',
        offerId: 'mock_stay_NRT_seed_tokyo',
        name: 'Northstar Studios',
        city: 'NRT',
        cityName: 'Tokyo',
        neighborhood: 'Shibuya',
        checkIn: isoDate(60),
        checkOut: isoDate(70),
        guests: 2,
        rooms: 1,
        totalAmount: 1820,
        pricePerNight: 182,
        currency: 'USD',
        rating: 4.5,
        propertyType: 'apartment',
        amenities: ['wifi', 'kitchen', 'workspace', 'ac'],
        cancellation: 'flexible',
        savedAt: now - 2 * DAY,
        status: 'wishlist',
      },
    },
  ];
}

// ─── SAVED ACTIVITIES ──────────────────────────────────────────────────
function makeActivitySeeds(): Array<{ activity: Activity; tripId?: string }> {
  const seeds: Array<{ activity: Activity; tripId?: string }> = [];
  const paris = getCityActivities('Paris')?.activities ?? [];
  const miami = getCityActivities('Miami')?.activities ?? [];
  const tokyo = getCityActivities('Tokyo')?.activities ?? [];
  for (const a of paris.slice(0, 4)) seeds.push({ activity: a, tripId: 'trip-order-paris-june' });
  for (const a of miami.slice(0, 3)) seeds.push({ activity: a, tripId: 'trip-order-miami-now' });
  if (tokyo[0]) seeds.push({ activity: tokyo[0] });
  return seeds;
}

// ─── CHAT THREADS ──────────────────────────────────────────────────────
function makeChatSeeds(): StoredChat[] {
  const now = Date.now();
  const msg = (role: 'user' | 'assistant', text: string, idx: number): StoredChatMessage => ({
    id: `seed-msg-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    parts: [{ type: 'text', text }],
  });
  return [
    {
      id: 'seed-chat-tokyo',
      title: 'Cheapest to Tokyo in August under $800',
      createdAt: now - 2 * DAY,
      updatedAt: now - 2 * DAY,
      messages: [
        msg('user', 'Cheapest to Tokyo in August under $800', 1),
        msg(
          'assistant',
          'JFK → NRT mid-August is currently $712 round-trip on the route you\'re watching — already below your $800 ceiling. Want me to keep watching for a sharper drop, or push toward booking?',
          2,
        ),
        msg('user', "Keep watching — but tell me if it dips under $680.", 3),
        msg(
          'assistant',
          'Alert set at $680. I\'ll ping you on any drop and refresh prices daily. The trend over the last two weeks has been downward, so a dip is plausible.',
          4,
        ),
      ],
    },
    {
      id: 'seed-chat-stay-marais',
      title: 'Find me a quiet stay in Le Marais',
      createdAt: now - 5 * DAY,
      updatedAt: now - 5 * DAY,
      messages: [
        msg('user', 'Find me a quiet stay in Le Marais for 2, June 10–18.', 1),
        msg(
          'assistant',
          'The Parchment Inn fits well — 8-room guesthouse in Le Marais, breakfast included, free cancellation, $156/night. Rated 4.6 and within walking distance of the Picasso Museum. I can book it now or save it for you to review.',
          2,
        ),
        msg('user', "Book it. Same dates as the SFO → CDG flight I'm watching.", 3),
        msg(
          'assistant',
          'Booked under reference VST4821 and linked to your Paris trip in June. I\'ve added it to the itinerary as the check-in for day 1.',
          4,
        ),
      ],
    },
    {
      id: 'seed-chat-paris-itinerary',
      title: 'Plan a 4-day Paris itinerary',
      createdAt: now - 1 * DAY,
      updatedAt: now - 1 * DAY,
      messages: [
        msg('user', 'Plan a 4-day Paris itinerary, balanced pace, light culture-heavy.', 1),
        msg(
          'assistant',
          "Drafted a skeleton: day 1 land + low-key first walk, day 2 Musée d'Orsay morning + Canal Saint-Martin apéro, day 3 a long lunch in Le Marais + Montmartre after dark, day 4 slow morning + airport. I've slotted the four Paris activities you've already saved into the right days. Open the itinerary editor on your Paris trip to refine it.",
          2,
        ),
        msg('user', 'Move the Musée d\'Orsay to day 3 morning — day 2 should be slower.', 3),
        msg(
          'assistant',
          "Done — day 2 is now \"Eat the city\" with just Canal Saint-Martin in the evening, and day 3 morning is Musée d'Orsay → Montmartre evening. The change is saved in the itinerary editor.",
          4,
        ),
      ],
    },
  ];
}

// ─── PAYMENT METHODS ───────────────────────────────────────────────────
function makePaymentSeeds() {
  return [
    {
      id: 'pm-seed-visa',
      brand: 'visa' as const,
      cardLast4: '4242',
      cardHolder: 'Alex Morgan',
      expiryMonth: 9,
      expiryYear: 2028,
      isDefault: true,
      nickname: 'Personal',
    },
    {
      id: 'pm-seed-mc',
      brand: 'mastercard' as const,
      cardLast4: '5588',
      cardHolder: 'Alex Morgan',
      expiryMonth: 4,
      expiryYear: 2027,
      isDefault: false,
      nickname: 'Travel',
    },
    {
      id: 'pm-seed-amex',
      brand: 'amex' as const,
      cardLast4: '1003',
      cardHolder: 'Alex Morgan',
      expiryMonth: 11,
      expiryYear: 2029,
      isDefault: false,
      nickname: 'Business',
    },
  ];
}

// ─── TRAVELER PROFILES ─────────────────────────────────────────────────
function makeTravelerProfileSeeds(): TravelerProfile[] {
  const now = Date.now();
  return [
    {
      id: 'traveler-owner',
      isOwner: true,
      title: 'mr',
      givenName: 'Alex',
      familyName: 'Morgan',
      middleName: 'J',
      bornOn: '1988-04-12',
      gender: 'm',
      email: 'alex.morgan@example.com',
      phoneNumber: '+14155550199',
      secondaryEmail: 'amorgan@work.example.com',
      emergencyContact: {
        name: 'Rae Morgan',
        relation: 'Sibling',
        phone: '+14155550247',
        email: 'rae@example.com',
      },
      passport: {
        number: 'P12345678',
        countryCode: 'US',
        issuedOn: '2021-08-04',
        expiresOn: '2031-08-03',
      },
      knownTravellerNumber: '987654321',
      redressNumber: undefined,
      frequentFlyers: [
        { carrierCode: 'AT', carrierName: 'Atlas Air', membershipNumber: 'AT-779812', tier: 'gold' },
        { carrierCode: 'NS', carrierName: 'Northstar', membershipNumber: 'NS-220047', tier: 'silver' },
      ],
      dietary: ['AVML'],
      accessibility: [],
      seatPreference: 'aisle',
      bagPreference: 'one_checked',
      preferredCabin: 'economy',
      hotelLoyalty: [{ chain: 'Atlas Hotels', number: 'AH-440219' }],
      notes: 'Standard demo profile · seeded.',
      createdAt: now - 30 * DAY,
      updatedAt: now,
    },
    {
      id: 'traveler-rae',
      isOwner: false,
      nickname: 'Rae (sibling)',
      title: 'ms',
      givenName: 'Rae',
      familyName: 'Morgan',
      bornOn: '1990-11-22',
      gender: 'f',
      email: 'rae@example.com',
      phoneNumber: '+14155550247',
      passport: {
        number: 'P98765432',
        countryCode: 'US',
        issuedOn: '2022-03-14',
        expiresOn: '2032-03-13',
      },
      frequentFlyers: [],
      dietary: ['VGML'],
      accessibility: [],
      seatPreference: 'window',
      bagPreference: 'one_checked',
      preferredCabin: 'economy',
      createdAt: now - 20 * DAY,
      updatedAt: now - 5 * DAY,
    },
    {
      id: 'traveler-jamie',
      isOwner: false,
      nickname: 'Jamie (partner)',
      title: 'mr',
      givenName: 'Jamie',
      familyName: 'Park',
      bornOn: '1986-07-30',
      gender: 'm',
      email: 'jamie.park@example.com',
      phoneNumber: '+14155550311',
      passport: {
        number: 'P55512309',
        countryCode: 'KR',
        issuedOn: '2020-06-18',
        expiresOn: '2030-06-17',
      },
      frequentFlyers: [
        { carrierCode: 'NS', carrierName: 'Northstar', membershipNumber: 'NS-559001', tier: 'standard' },
      ],
      dietary: ['MOML'],
      accessibility: [],
      seatPreference: 'aisle',
      bagPreference: 'two_checked',
      preferredCabin: 'economy',
      createdAt: now - 12 * DAY,
      updatedAt: now - 2 * DAY,
    },
  ];
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────
function makeNotificationSeeds() {
  const now = Date.now();
  const min = 60_000;
  return [
    {
      id: 'n-seed-1',
      type: 'price_drop' as const,
      title: 'JFK → Tokyo dropped to $712',
      message: 'Down $16 since yesterday. Lowest you\'ve seen on this watch.',
      time: '12 minutes ago',
      read: false,
      icon: 'TrendingDown',
      createdAt: now - 12 * min,
      refs: { trackedId: 'JFK-NRT-2026-08-12-2026-08-22-1-economy' },
    },
    {
      id: 'n-seed-2',
      type: 'check_in' as const,
      title: 'Miami check-in opens in 12 hours',
      message: 'Northstar NS412 · I\'ll grab your seat at 24h prior if you tap once.',
      time: '2 hours ago',
      read: false,
      icon: 'Plane',
      createdAt: now - 2 * 60 * min,
      refs: { orderId: 'order-miami-now', tripId: 'trip-order-miami-now' },
    },
    {
      id: 'n-seed-3',
      type: 'booking' as const,
      title: 'Stay confirmed · The Parchment Inn',
      message: 'June 10 – 18 · Reference VST4821',
      time: '5 days ago',
      read: true,
      icon: 'BedDouble',
      createdAt: now - 5 * DAY,
      refs: { tripId: 'trip-order-paris-june' },
    },
    {
      id: 'n-seed-4',
      type: 'offer' as const,
      title: 'Concierge suggestion · Lisbon return',
      message: 'JFK → LIS in October has dipped 23%. Worth a look?',
      time: '1 day ago',
      read: false,
      icon: 'Sparkles',
      createdAt: now - 1 * DAY,
    },
    {
      id: 'n-seed-5',
      type: 'message' as const,
      title: 'Voyage concierge',
      message: '4-day Paris itinerary is drafted. Open the editor to refine.',
      time: '1 day ago',
      read: false,
      icon: 'MessageCircle',
      user: { name: 'Voyage concierge' },
      createdAt: now - 1 * DAY,
      refs: { tripId: 'trip-order-paris-june' },
    },
    {
      id: 'n-seed-6',
      type: 'payment' as const,
      title: 'Visa •4242 charged $612',
      message: 'For booking VOY7A2X · SFO → CDG · June',
      time: '6 days ago',
      read: true,
      icon: 'CreditCard',
      createdAt: now - 6 * DAY,
    },
    {
      id: 'n-seed-7',
      type: 'price_drop' as const,
      title: 'LAX → London is creeping up',
      message: 'Up $60 this week. Trend favors waiting; I\'ll tell you when it reverses.',
      time: '3 days ago',
      read: true,
      icon: 'TrendingUp',
      createdAt: now - 3 * DAY,
      refs: { trackedId: 'LAX-LHR-2026-09-04-2026-09-14-1-business' },
    },
    {
      id: 'n-seed-8',
      type: 'system' as const,
      title: 'Welcome to Voyage',
      message: 'Your demo trips, stays, and watches are seeded. Browse freely — reset from settings any time.',
      time: '30 days ago',
      read: true,
      icon: 'Compass',
      createdAt: now - 30 * DAY,
    },
  ];
}

// ─── RECENT SEARCHES ───────────────────────────────────────────────────
const RECENT_FLIGHT_SEARCHES: Array<{ origin: string; destination: string }> = [
  { origin: 'JFK', destination: 'NRT' },
  { origin: 'SFO', destination: 'CDG' },
  { origin: 'LAX', destination: 'LHR' },
  { origin: 'JFK', destination: 'MIA' },
  { origin: 'EWR', destination: 'FCO' },
];

const RECENT_STAY_SEARCHES: Array<{ city: string; cityName: string; guests: number }> = [
  { city: 'CDG', cityName: 'Paris', guests: 2 },
  { city: 'NRT', cityName: 'Tokyo', guests: 2 },
  { city: 'MIA', cityName: 'Miami', guests: 1 },
  { city: 'LIS', cityName: 'Lisbon', guests: 2 },
  { city: 'BCN', cityName: 'Barcelona', guests: 4 },
];

// ─── TRIPS (enriched with itinerary days where helpful) ────────────────
async function seedTripExtras(): Promise<void> {
  const parisTrip = await ensureItineraryDays('trip-order-paris-june');
  if (parisTrip && parisTrip.itineraryDays.length >= 3) {
    const parisActs = (getCityActivities('Paris')?.activities ?? []).slice(0, 4);
    const dayDates = parisTrip.itineraryDays.map((d) => d.date);
    const placements: Array<{ date: string; time: string; act: Activity }> = [
      parisActs[0] && dayDates[1] ? { date: dayDates[1], time: '10:00', act: parisActs[0] } : null,
      parisActs[1] && dayDates[1] ? { date: dayDates[1], time: '19:30', act: parisActs[1] } : null,
      parisActs[2] && dayDates[2] ? { date: dayDates[2], time: '11:00', act: parisActs[2] } : null,
      parisActs[3] && dayDates[2] ? { date: dayDates[2], time: '21:00', act: parisActs[3] } : null,
    ].filter(Boolean) as Array<{ date: string; time: string; act: Activity }>;
    for (const p of placements) {
      await addItinerarySlot(parisTrip.id, p.date, {
        id: `slot-${p.act.id}`,
        time: p.time,
        kind: 'activity',
        title: p.act.title,
        detail: p.act.blurb,
        ref: { activityId: p.act.id },
      });
    }
    if (dayDates[0]) {
      await addItinerarySlot(parisTrip.id, dayDates[0], {
        id: 'slot-stay-paris',
        time: '15:30',
        kind: 'stay',
        title: 'Check in · The Parchment Inn',
        detail: 'Le Marais · breakfast 7–10am',
        ref: { stayId: 'CDG|2026-06-10|2026-06-18|2|1|seed-stay-paris' },
      });
    }
  }
  await ensureItineraryDays('trip-order-miami-now');
  await ensureItineraryDays('trip-order-lisbon-past');
}

// ─── PUBLIC API ────────────────────────────────────────────────────────

export async function seedDevDataIfNeeded(): Promise<{ seeded: boolean; ran: string[] }> {
  const ran: string[] = [];

  // Tracked routes
  if (await isEmpty('@voyage/tracked')) {
    for (const r of makeTrackedSeeds()) await saveTracked(r);
    ran.push('tracked');
  }
  // Orders
  if (await isEmpty('@voyage/orders')) {
    for (const o of makeOrderSeeds()) await saveOrder(o);
    ran.push('orders');
  }
  // Trips (derive from orders, enrich with itinerary + slots)
  if (await isEmpty('@voyage/trips')) {
    for (const o of makeOrderSeeds()) {
      await upsertTripFromOrder(o);
    }
    await seedTripExtras();
    ran.push('trips');
  }
  // Saved stays
  if (await isEmpty('@voyage/saved-stays')) {
    const { stays } = await readSeededStays();
    await writeSeededStays(stays);
    for (const { stay, tripId } of makeStaySeeds()) {
      if (tripId) await linkStayToTrip(tripId, stay.id);
    }
    ran.push('stays');
  }
  // Saved activities
  if (await isEmpty('@voyage/saved-activities')) {
    for (const { activity, tripId } of makeActivitySeeds()) {
      await saveActivity(activity, { tripId });
      if (tripId) await linkActivityToTrip(tripId, activity.id);
    }
    ran.push('activities');
  }
  // Recent flight searches
  if (await isEmpty('@voyage/recent-searches')) {
    for (const r of RECENT_FLIGHT_SEARCHES.slice().reverse()) await addRecent(r.origin, r.destination);
    ran.push('recent-flight-searches');
  }
  // Recent stay searches
  if (await isEmpty('@voyage/recent-stay-searches')) {
    for (const r of RECENT_STAY_SEARCHES.slice().reverse()) await addRecentStaySearch(r);
    ran.push('recent-stay-searches');
  }
  // Chats
  if (await isEmpty('@voyage/chats')) {
    for (const c of makeChatSeeds()) await saveChat(c);
    ran.push('chats');
  }
  // Notifications
  if (await isEmpty('@voyage/notifications')) {
    await setAllNotifications(makeNotificationSeeds());
    ran.push('notifications');
  }
  // Payment methods
  if (await isEmpty('@voyage/payment-methods')) {
    await setAllPaymentMethods(makePaymentSeeds());
    ran.push('payment-methods');
  }
  // Traveler profiles
  if (await isEmpty('@voyage/traveler-profiles')) {
    await setAllProfiles(makeTravelerProfileSeeds());
    ran.push('traveler-profiles');
  }
  // Trip companion (one active session for Miami)
  if (await isEmpty('@voyage/trip-companion')) {
    await saveTripCompanionSession({
      tripId: 'trip-order-miami-now',
      selectedDayIndex: 1,
      trackingState: 'tracking',
      startedAt: Date.now() - 3 * 60 * 60 * 1000,
      latestLocation: {
        latitude: 25.7849,
        longitude: -80.131,
        accuracy: 25,
        heading: 95,
        speed: 0,
        recordedAt: Date.now() - 2 * 60 * 1000,
      },
    });
    ran.push('trip-companion');
  }

  return { seeded: ran.length > 0, ran };
}

// Directly seed saved stays via storage helper to avoid relying on
// stayKey logic. Mirrors what saveStay would write but skips the offer
// fetch (we already have a SavedStay record).
async function writeSeededStays(stays: SavedStay[]): Promise<void> {
  await AsyncStorage.setItem('@voyage/saved-stays', JSON.stringify(stays));
}
async function readSeededStays(): Promise<{ stays: SavedStay[] }> {
  return { stays: makeStaySeeds().map((s) => s.stay) };
}

export async function resetDevData(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const voyageKeys = allKeys.filter(
    (k) => k.startsWith('@voyage/') || k.startsWith('voyage/'),
  );
  await AsyncStorage.multiRemove(voyageKeys);
  await seedDevDataIfNeeded();
}

// ─── External-API fallbacks ───────────────────────────────────────────

const MOCK_WEATHER: Record<string, { tempC: number; condition: string; precipPct: number }> = {
  'New York': { tempC: 22, condition: 'Partly cloudy', precipPct: 10 },
  'Los Angeles': { tempC: 26, condition: 'Sunny', precipPct: 0 },
  Miami: { tempC: 30, condition: 'Humid · scattered showers', precipPct: 40 },
  Paris: { tempC: 18, condition: 'Overcast', precipPct: 25 },
  London: { tempC: 16, condition: 'Light rain', precipPct: 65 },
  Tokyo: { tempC: 24, condition: 'Clear', precipPct: 5 },
  Lisbon: { tempC: 21, condition: 'Sunny', precipPct: 5 },
  Rome: { tempC: 27, condition: 'Sunny', precipPct: 5 },
  Barcelona: { tempC: 24, condition: 'Partly cloudy', precipPct: 10 },
  Amsterdam: { tempC: 17, condition: 'Light wind', precipPct: 30 },
};
export function mockWeatherFor(city: string) {
  return MOCK_WEATHER[city] ?? MOCK_WEATHER[city.replace(/\s+/g, ' ').trim()] ?? null;
}

const MOCK_HOLIDAYS: Record<string, Array<{ date: string; name: string }>> = {
  US: [
    { date: '2026-07-04', name: 'Independence Day' },
    { date: '2026-09-07', name: 'Labor Day' },
    { date: '2026-11-26', name: 'Thanksgiving' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ],
  GB: [
    { date: '2026-05-04', name: 'Early May bank holiday' },
    { date: '2026-08-31', name: 'Summer bank holiday' },
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-12-28', name: 'Boxing Day (substitute)' },
  ],
  JP: [
    { date: '2026-04-29', name: "Shōwa Day" },
    { date: '2026-05-03', name: 'Constitution Memorial Day' },
    { date: '2026-05-05', name: "Children's Day" },
    { date: '2026-11-23', name: 'Labor Thanksgiving Day' },
  ],
  FR: [
    { date: '2026-05-01', name: 'Labour Day' },
    { date: '2026-07-14', name: 'Bastille Day' },
    { date: '2026-08-15', name: 'Assumption of Mary' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ],
};
export function mockHolidaysFor(country: string) {
  return MOCK_HOLIDAYS[country.toUpperCase()] ?? null;
}

export function getMockCalendarEvents() {
  const now = new Date();
  const todayWork = new Date(now);
  todayWork.setHours(9, 0, 0, 0);
  const meeting = new Date(now);
  meeting.setDate(meeting.getDate() + 5);
  meeting.setHours(14, 0, 0, 0);
  const dinner = new Date(now);
  dinner.setDate(dinner.getDate() + 10);
  dinner.setHours(19, 30, 0, 0);
  return [
    {
      id: 'cal-mock-1',
      title: 'Focus block · ship Voyage 10/10',
      startsAt: todayWork.toISOString(),
      endsAt: new Date(todayWork.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      allDay: false,
    },
    {
      id: 'cal-mock-2',
      title: 'Quarterly review',
      startsAt: meeting.toISOString(),
      endsAt: new Date(meeting.getTime() + 60 * 60 * 1000).toISOString(),
      allDay: false,
    },
    {
      id: 'cal-mock-3',
      title: 'Dinner with Rae',
      startsAt: dinner.toISOString(),
      endsAt: new Date(dinner.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      allDay: false,
    },
  ];
}
