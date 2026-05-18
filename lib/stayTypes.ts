export type StayPropertyType = 'hotel' | 'apartment' | 'guesthouse' | 'resort' | 'hostel' | 'bnb';

export type StayAmenity =
  | 'wifi'
  | 'pool'
  | 'gym'
  | 'breakfast'
  | 'parking'
  | 'pet_friendly'
  | 'kitchen'
  | 'workspace'
  | 'view'
  | 'spa'
  | 'beach'
  | 'ac';

export type StayCancellation = 'free' | 'flexible' | 'non_refundable';

export type StaySearchParams = {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
};

export type StayOffer = {
  id: string;
  name: string;
  propertyType: StayPropertyType;
  city: string;
  cityName: string;
  neighborhood?: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  totalAmount: number;
  nights: number;
  currency: string;
  amenities: StayAmenity[];
  cancellation: StayCancellation;
  distanceFromCenterKm: number;
  description: string;
  hostName?: string;
  available: boolean;
  createdAt?: number;
  expires_at?: string;
  /** Photo URLs. Comes from real provider (Duffel) when available, otherwise from photoProvider.photosForStay. */
  photos?: string[];
};

export type SavedStayStatus = 'wishlist' | 'booked';

export type SavedStay = {
  id: string;
  offerId: string;
  name: string;
  city: string;
  cityName: string;
  neighborhood?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  totalAmount: number;
  pricePerNight: number;
  currency: string;
  rating: number;
  propertyType: StayPropertyType;
  amenities: StayAmenity[];
  cancellation: StayCancellation;
  savedAt: number;
  tripId?: string;
  nickname?: string;
  status?: SavedStayStatus;
  bookingReference?: string;
  leadGuestName?: string;
  bookedAt?: number;
  /** First entry of StayOffer.photos at the time of saving, denormalized so the trip-detail StayRow can render a thumbnail without re-fetching the offer. */
  coverPhoto?: string;
};

export type RecentStaySearch = {
  city: string;
  cityName: string;
  guests: number;
  at: number;
};
