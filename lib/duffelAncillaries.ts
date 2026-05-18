// Duffel ancillaries catalog — local-first mock data mirroring what
// https://duffel.com/docs/api/v2/orders/ancillaries exposes.
// No live API calls; catalogs are consumed by the checkout flow.

import type { BagPreference, DietaryCode, SeatPreference } from '@/lib/travelerProfileTypes';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BagOption = {
  id: string;
  kind: 'carry_on' | 'checked' | 'oversize' | 'sports' | 'pet';
  label: string;
  weightKg: number;
  priceUSD: number;
  description: string;
};

export type SeatOption = {
  id: string;
  kind: 'standard' | 'preferred' | 'extra_legroom' | 'exit_row' | 'bulkhead' | 'window' | 'aisle';
  label: string;
  priceUSD: number;
  description: string;
};

export type MealOption = {
  id: string;
  code: string;          // SSR-style code, e.g. 'AVML'
  label: string;
  priceUSD: number;      // 0 for included
  description: string;
};

export type ExtraOption = {
  id: string;
  kind: 'priority_boarding' | 'lounge' | 'fast_track' | 'wifi' | 'travel_insurance' | 'carbon_offset';
  label: string;
  priceUSD: number;
  description: string;
};

export type AncillaryPicks = {
  bagIds: string[];      // each id = one bag bought
  seatIds: string[];     // one per slice/segment
  mealIds: string[];     // one per slice
  extraIds: string[];
};

export function emptyPicks(): AncillaryPicks {
  return { bagIds: [], seatIds: [], mealIds: [], extraIds: [] };
}

// ─── Catalogs ─────────────────────────────────────────────────────────────────

export const BAG_OPTIONS: BagOption[] = [
  {
    id: 'bag-carry-on',
    kind: 'carry_on',
    label: 'Carry-on bag',
    weightKg: 7,
    priceUSD: 0,
    description: 'Standard cabin bag (fits overhead or under seat). Included.',
  },
  {
    id: 'bag-checked-1',
    kind: 'checked',
    label: '1 checked bag',
    weightKg: 23,
    priceUSD: 30,
    description: 'One 23 kg checked bag. Standard hold luggage.',
  },
  {
    id: 'bag-checked-2',
    kind: 'checked',
    label: '2 checked bags',
    weightKg: 23,
    priceUSD: 55,
    description: 'Two 23 kg checked bags. Great for longer trips.',
  },
  {
    id: 'bag-oversize',
    kind: 'oversize',
    label: 'Oversize bag',
    weightKg: 32,
    priceUSD: 75,
    description: 'Oversize item up to 32 kg — golf clubs, skis, large frames.',
  },
  {
    id: 'bag-sports',
    kind: 'sports',
    label: 'Sports equipment',
    weightKg: 23,
    priceUSD: 90,
    description: 'Bike, surfboard, or other specialist sports gear.',
  },
  {
    id: 'bag-pet',
    kind: 'pet',
    label: 'Pet in cabin',
    weightKg: 8,
    priceUSD: 120,
    description: 'Small pet in an approved carrier, travelling in cabin.',
  },
];

export const SEAT_OPTIONS: SeatOption[] = [
  {
    id: 'seat-standard',
    kind: 'standard',
    label: 'Standard seat',
    priceUSD: 0,
    description: 'Assigned at check-in at no extra cost.',
  },
  {
    id: 'seat-preferred',
    kind: 'preferred',
    label: 'Preferred seat',
    priceUSD: 12,
    description: 'Desirable mid-cabin seat with faster boarding access.',
  },
  {
    id: 'seat-extra-legroom',
    kind: 'extra_legroom',
    label: 'Extra legroom',
    priceUSD: 28,
    description: 'Up to 6 inches of extra legroom in economy class.',
  },
  {
    id: 'seat-exit-row',
    kind: 'exit_row',
    label: 'Exit row',
    priceUSD: 35,
    description: 'Maximum legroom. Passengers must assist in an emergency.',
  },
  {
    id: 'seat-bulkhead',
    kind: 'bulkhead',
    label: 'Bulkhead',
    priceUSD: 20,
    description: 'Front-of-cabin seat with extra floor space.',
  },
];

export const MEAL_OPTIONS: MealOption[] = [
  {
    id: 'meal-avml',
    code: 'AVML',
    label: 'Vegetarian (Indian)',
    priceUSD: 0,
    description: 'Asian vegetarian meal. Lacto-vegetarian, no meat or fish.',
  },
  {
    id: 'meal-vgml',
    code: 'VGML',
    label: 'Vegan',
    priceUSD: 0,
    description: 'Strict vegan — no animal products whatsoever.',
  },
  {
    id: 'meal-moml',
    code: 'MOML',
    label: 'Halal',
    priceUSD: 0,
    description: 'Prepared in accordance with Islamic dietary law.',
  },
  {
    id: 'meal-ksml',
    code: 'KSML',
    label: 'Kosher',
    priceUSD: 0,
    description: 'Prepared and sealed under rabbinical supervision.',
  },
  {
    id: 'meal-gfml',
    code: 'GFML',
    label: 'Gluten-free',
    priceUSD: 0,
    description: 'Free from wheat, barley, rye, and oats.',
  },
  {
    id: 'meal-dbml',
    code: 'DBML',
    label: 'Diabetic',
    priceUSD: 0,
    description: 'Low sugar, low fat, high fibre meal for diabetics.',
  },
  {
    id: 'meal-premium',
    code: 'PRML',
    label: 'Premium meal',
    priceUSD: 18,
    description: 'Chef-curated multi-course meal with a welcome drink.',
  },
];

export const EXTRA_OPTIONS: ExtraOption[] = [
  {
    id: 'extra-priority',
    kind: 'priority_boarding',
    label: 'Priority boarding',
    priceUSD: 15,
    description: 'Board first and secure overhead bin space.',
  },
  {
    id: 'extra-lounge',
    kind: 'lounge',
    label: 'Airport lounge',
    priceUSD: 45,
    description: 'Day pass to the partner lounge at your departure airport.',
  },
  {
    id: 'extra-fast-track',
    kind: 'fast_track',
    label: 'Fast-track security',
    priceUSD: 25,
    description: 'Dedicated security lane — skip the queue.',
  },
  {
    id: 'extra-wifi',
    kind: 'wifi',
    label: 'In-flight Wi-Fi',
    priceUSD: 18,
    description: 'Full-flight streaming Wi-Fi pass.',
  },
  {
    id: 'extra-insurance',
    kind: 'travel_insurance',
    label: 'Travel insurance',
    priceUSD: 28,
    description: 'Cancellation, delay, and medical cover for this trip.',
  },
  {
    id: 'extra-carbon',
    kind: 'carbon_offset',
    label: 'Carbon offset',
    priceUSD: 8,
    description: 'Offset the estimated CO₂ of your flight via Atmosfair.',
  },
];

// ─── Helper: map profile bag preference to pre-selected bag id ──────────────

export function defaultBagIdsForPreference(pref: BagPreference): string[] {
  switch (pref) {
    case 'carry_on_only': return ['bag-carry-on'];
    case 'one_checked':   return ['bag-checked-1'];
    case 'two_checked':   return ['bag-checked-2'];
    case 'oversize':      return ['bag-oversize'];
    case 'sports':        return ['bag-sports'];
    default:              return [];
  }
}

// ─── Helper: map profile seat preference to pre-selected seat id ─────────────

export function defaultSeatIdForPreference(pref: SeatPreference): string[] {
  switch (pref) {
    case 'window':       return ['seat-preferred'];   // closest match
    case 'aisle':        return ['seat-preferred'];
    case 'exit_row':     return ['seat-exit-row'];
    case 'middle':       return ['seat-standard'];
    case 'no_preference':
    default:             return [];
  }
}

// ─── Helper: map profile dietary codes to pre-selected meal ids ───────────────

export function defaultMealIdsForDietary(dietaryCodes: DietaryCode[]): string[] {
  const codeToMealId: Partial<Record<DietaryCode, string>> = {
    AVML: 'meal-avml',
    VGML: 'meal-vgml',
    MOML: 'meal-moml',
    KSML: 'meal-ksml',
    GFML: 'meal-gfml',
    DBML: 'meal-dbml',
  };
  return dietaryCodes.flatMap((c) => (codeToMealId[c] ? [codeToMealId[c]!] : []));
}

// ─── Total calculator ─────────────────────────────────────────────────────────

export function ancillariesTotalUSD(picks: AncillaryPicks): number {
  const bagTotal = picks.bagIds.reduce((sum, id) => {
    const opt = BAG_OPTIONS.find((b) => b.id === id);
    return sum + (opt?.priceUSD ?? 0);
  }, 0);

  const seatTotal = picks.seatIds.reduce((sum, id) => {
    const opt = SEAT_OPTIONS.find((s) => s.id === id);
    return sum + (opt?.priceUSD ?? 0);
  }, 0);

  const mealTotal = picks.mealIds.reduce((sum, id) => {
    const opt = MEAL_OPTIONS.find((m) => m.id === id);
    return sum + (opt?.priceUSD ?? 0);
  }, 0);

  const extraTotal = picks.extraIds.reduce((sum, id) => {
    const opt = EXTRA_OPTIONS.find((e) => e.id === id);
    return sum + (opt?.priceUSD ?? 0);
  }, 0);

  return bagTotal + seatTotal + mealTotal + extraTotal;
}
