// The "Trip" umbrella that groups a flight order, stays, activities, and
// itinerary days into one entity. Existing StoredOrder / SavedStay /
// SavedActivity remain canonical for their domain; Trip just references
// them by id and adds the connective tissue (status, dates, itinerary,
// notes, cover glyph).

export type TripStatus = 'planning' | 'booked' | 'active' | 'past';

export type ItinerarySlotKind = 'activity' | 'stay' | 'flight' | 'note';

export type ItinerarySlot = {
  id: string;
  time?: string;
  kind: ItinerarySlotKind;
  title: string;
  detail?: string;
  ref?: {
    activityId?: string;
    stayId?: string;
    orderId?: string;
  };
};

export type ItineraryDay = {
  date: string;
  theme?: string;
  slots: ItinerarySlot[];
};

export type Trip = {
  id: string;
  title: string;
  primaryDestination: string;
  primaryDestinationName: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  orderIds: string[];
  stayIds: string[];
  activityIds: string[];
  itineraryDays: ItineraryDay[];
  notes?: string;
  coverGlyphIata?: string;
  createdAt: number;
  updatedAt: number;
};

export function deriveTripStatus(
  startDate: string,
  endDate: string,
  hasOrders: boolean,
): TripStatus {
  const now = Date.now();
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (Number.isFinite(end) && end < now) return 'past';
  if (Number.isFinite(start) && Number.isFinite(end) && start <= now && now <= end) return 'active';
  if (hasOrders) return 'booked';
  return 'planning';
}

export function tripIdForOrder(orderId: string): string {
  return `trip-${orderId}`;
}

export function makeSlotId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
