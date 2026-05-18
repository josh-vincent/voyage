// Deterministic photo URL generators for mock stay / activity / city imagery.
// Returns URLs only (no fetching). Synchronous, no env dep.
//
// Real Duffel Stays responses already include real photos under
// accommodation.photos[].url — those flow through duffelStays.mapDuffelStays
// directly. This provider is for the mock path AND for surfaces that have
// no upstream photo source (activities, city covers).
//
// Why picsum.photos: free, no API key, seed-keyed — guarantees a unique image
// per seed so overlapping keyword bundles never collapse to the same CDN cache
// hit (the old LoremFlickr approach was broken for similar keyword sets).
// Keywords are kept as comments for documentation only.

import type { StayPropertyType } from './stayTypes';

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function picsum(seed: string, size = '800x600'): string {
  const [w, h] = size.split('x');
  return `https://picsum.photos/seed/${hash(seed)}/${w}/${h}`;
}

export type PhotosForStayInput = {
  id: string;
  cityName: string;
  propertyType: StayPropertyType;
  brand?: string;
  count?: number;
};

export function photosForStay({
  id,
  cityName: _cityName,
  propertyType: _propertyType,
  brand: _brand,
  count = 4,
}: PhotosForStayInput): string[] {
  // Keywords (for documentation): [cityName, propertyType, brand, slot-variant]
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(picsum(`${id}|${i}`, '800x600'));
  }
  return out;
}

export function photoForActivity(activity: {
  id: string;
  title: string;
  kind: string;
  area?: string;
  city: string;
}): string {
  // Keywords (for documentation): [city, area, kind, title]
  return picsum(`act|${activity.id}`, '800x600');
}

export function photosForActivity(activity: {
  id: string;
  title: string;
  kind: string;
  area?: string;
  city: string;
}, count = 3): string[] {
  // Keywords (for documentation): [city, area, kind, slot-variant]
  return Array.from({ length: count }, (_, i) =>
    picsum(`act|${activity.id}|${i}`, '800x600'),
  );
}

export function coverForCity(cityOrIata: string): string {
  // Keywords (for documentation): [city, travel, cityscape]
  return picsum(`city|${cityOrIata}`, '1200x800');
}

export function coverForTrip(trip: { primaryDestinationName?: string; primaryDestination?: string; id: string }): string {
  // Keywords (for documentation): [primaryDestination, travel]
  return picsum(`trip|${trip.id}`, '1200x800');
}
