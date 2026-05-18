// Favorites Bundle — a user-curated collection of saved stays / activities /
// flights with an optional date window. The deal-finder evaluates a bundle
// under different strategies (cheapest, best-rated, most-reviewed, balanced)
// and presents ranked combinations back to the user.

export type BundleItemRef =
  | { kind: 'stay'; savedStayId: string }
  | { kind: 'activity'; savedActivityId: string }
  | { kind: 'flight'; trackedRouteId: string };

export type Bundle = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Optional travel window. Both dates are ISO yyyy-mm-dd. */
  dateRange?: { from: string; to: string };
  /** Optional IATA city / airport hints — used to filter items when many are present. */
  cities?: string[];
  items: BundleItemRef[];
  notes?: string;
  /** Stable cover photo at the time of creation. Falls back to first item's photo. */
  coverPhoto?: string;
};

export type DealStrategy = 'cheapest' | 'best_rated' | 'most_reviewed' | 'balanced';

export type DealStayLine = {
  kind: 'stay';
  savedStayId: string;
  name: string;
  cityName: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  totalAmount: number;
  currency: string;
  nights: number;
  coverPhoto?: string;
};

export type DealActivityLine = {
  kind: 'activity';
  savedActivityId: string;
  title: string;
  area: string;
  priceLevel: 1 | 2 | 3;
  photo?: string;
};

export type DealFlightLine = {
  kind: 'flight';
  trackedRouteId: string;
  origin: string;
  destination: string;
  lastPrice: number;
  lowestPrice: number;
  currency: string;
};

export type DealLine = DealStayLine | DealActivityLine | DealFlightLine;

export type Deal = {
  bundleId: string;
  strategy: DealStrategy;
  lines: DealLine[];
  /** Sum of stay totalAmount + flight lastPrice + activity proxy ($25 × priceLevel). */
  totalUSD: number;
  /** Average rating across stays (and rate-able items). */
  averageRating: number;
  /** Sum of review counts across stays. */
  totalReviews: number;
  /** Short editorial caption: "Cheapest combo · 4 nights + 3 things · $612". */
  caption: string;
};
