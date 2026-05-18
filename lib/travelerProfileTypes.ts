// Traveler profile — one-time configuration the user sets so every
// booking flow can prefill instead of asking again. Modelled around what
// Duffel's order + ancillaries APIs need (see https://duffel.com/docs).
// Stored locally; we never sync to a remote.

export type Title = 'mr' | 'mrs' | 'ms' | 'miss' | 'dr';
export type Gender = 'm' | 'f' | 'x';

export type DietaryCode =
  | 'AVML' // Vegetarian
  | 'VGML' // Vegan
  | 'MOML' // Halal
  | 'KSML' // Kosher
  | 'HNML' // Hindu (non-veg)
  | 'GFML' // Gluten-free
  | 'LSML' // Low salt
  | 'DBML' // Diabetic
  | 'NLML' // Low lactose
  | 'BBML' // Infant / baby
  | 'CHML' // Child
  | 'SFML'; // Seafood

export const DIETARY_LABEL: Record<DietaryCode, string> = {
  AVML: 'Vegetarian',
  VGML: 'Vegan',
  MOML: 'Halal',
  KSML: 'Kosher',
  HNML: 'Hindu (non-veg)',
  GFML: 'Gluten-free',
  LSML: 'Low salt',
  DBML: 'Diabetic',
  NLML: 'Low lactose',
  BBML: 'Infant',
  CHML: 'Child',
  SFML: 'Seafood',
};

export type AccessibilityNeed =
  | 'wheelchair_full'
  | 'wheelchair_steps'
  | 'wheelchair_cabin'
  | 'visual_impairment'
  | 'hearing_impairment'
  | 'oxygen'
  | 'service_animal'
  | 'unaccompanied_minor';

export const ACCESSIBILITY_LABEL: Record<AccessibilityNeed, string> = {
  wheelchair_full: 'Wheelchair · all distances',
  wheelchair_steps: 'Wheelchair · can climb steps',
  wheelchair_cabin: 'Wheelchair to cabin door',
  visual_impairment: 'Visual impairment assistance',
  hearing_impairment: 'Hearing impairment assistance',
  oxygen: 'On-board oxygen',
  service_animal: 'Travelling with service animal',
  unaccompanied_minor: 'Unaccompanied minor service',
};

export type SeatPreference = 'window' | 'aisle' | 'middle' | 'exit_row' | 'no_preference';
export const SEAT_PREFERENCE_LABEL: Record<SeatPreference, string> = {
  window: 'Window',
  aisle: 'Aisle',
  middle: 'Middle',
  exit_row: 'Exit row',
  no_preference: 'No preference',
};

export type BagPreference = 'carry_on_only' | 'one_checked' | 'two_checked' | 'oversize' | 'sports';
export const BAG_PREFERENCE_LABEL: Record<BagPreference, string> = {
  carry_on_only: 'Carry-on only',
  one_checked: '1 checked',
  two_checked: '2 checked',
  oversize: 'Oversize / golf / ski',
  sports: 'Sports equipment',
};

export type FrequentFlyer = {
  carrierCode: string;     // 'AT', 'NS', etc.
  carrierName: string;     // 'Atlas Air'
  membershipNumber: string;
  tier?: 'standard' | 'silver' | 'gold' | 'platinum';
};

export type Passport = {
  number: string;
  countryCode: string;     // ISO 3166-1 alpha-2, e.g. 'US'
  issuedOn?: string;       // YYYY-MM-DD
  expiresOn: string;       // YYYY-MM-DD
};

export type EmergencyContact = {
  name: string;
  relation: string;
  phone: string;
  email?: string;
};

export type TravelerProfile = {
  id: string;
  isOwner: boolean;        // true for the user's own profile, false for companions
  nickname?: string;       // e.g. "Sarah (partner)" — only used for companions
  // Personal
  title: Title;
  givenName: string;
  familyName: string;
  middleName?: string;
  bornOn: string;          // YYYY-MM-DD
  gender: Gender;
  // Contact
  email: string;
  phoneNumber: string;     // E.164
  secondaryEmail?: string;
  emergencyContact?: EmergencyContact;
  // Travel docs
  passport?: Passport;
  knownTravellerNumber?: string;
  redressNumber?: string;
  // Loyalty
  frequentFlyers: FrequentFlyer[];
  // Preferences
  dietary: DietaryCode[];
  accessibility: AccessibilityNeed[];
  seatPreference: SeatPreference;
  bagPreference: BagPreference;
  preferredCabin?: 'economy' | 'premium_economy' | 'business' | 'first';
  // Loyalty extras
  hotelLoyalty?: Array<{ chain: string; number: string }>;
  // Notes
  notes?: string;
  // Audit
  createdAt: number;
  updatedAt: number;
};

export function emptyProfile(opts: { isOwner: boolean; id?: string; nickname?: string }): TravelerProfile {
  const now = Date.now();
  return {
    id: opts.id ?? `traveler-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    isOwner: opts.isOwner,
    nickname: opts.nickname,
    title: 'mr',
    givenName: '',
    familyName: '',
    bornOn: '',
    gender: 'm',
    email: '',
    phoneNumber: '',
    frequentFlyers: [],
    dietary: [],
    accessibility: [],
    seatPreference: 'no_preference',
    bagPreference: 'one_checked',
    createdAt: now,
    updatedAt: now,
  };
}

export function profileDisplayName(p: TravelerProfile): string {
  const full = `${p.givenName} ${p.familyName}`.trim();
  if (p.nickname) return p.nickname;
  return full || 'Unnamed traveler';
}

export function profileCompletion(p: TravelerProfile): {
  score: number;
  required: number;
  missing: string[];
} {
  const checks: Array<{ key: string; ok: boolean }> = [
    { key: 'Name', ok: !!p.givenName && !!p.familyName },
    { key: 'Date of birth', ok: !!p.bornOn },
    { key: 'Email', ok: !!p.email },
    { key: 'Phone', ok: !!p.phoneNumber },
    { key: 'Passport', ok: !!p.passport?.number && !!p.passport?.expiresOn },
    { key: 'Seat preference', ok: p.seatPreference !== 'no_preference' },
    { key: 'Bag preference', ok: !!p.bagPreference },
  ];
  const ok = checks.filter((c) => c.ok).length;
  return {
    score: ok,
    required: checks.length,
    missing: checks.filter((c) => !c.ok).map((c) => c.key),
  };
}
