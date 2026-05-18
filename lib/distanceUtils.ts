import { haversineKm } from '@/lib/airportCoords';
import { cityCoord } from '@/lib/cityCoords';
import type { Activity } from '@/lib/discover';
import type { SavedStay } from '@/lib/stayTypes';

export type Distance = { km: number; mins: number };

export function activityDistanceFromStay(activity: Activity, stay: SavedStay): Distance | null {
  if (activity.lat == null || activity.lng == null) return null;
  const centroid = cityCoord(stay.cityName) ?? cityCoord(stay.city);
  if (!centroid) return null;
  const km = haversineKm({ lat: centroid.lat, lng: centroid.lng }, { lat: activity.lat, lng: activity.lng });
  // Rough estimate: walking ~12 min/km up to 5 km, driving ~35 km/h after.
  const mins = km < 5 ? Math.round(km * 12) : Math.round(km * (60 / 35));
  return { km, mins };
}

export function formatDistance(d: Distance | null): string {
  if (!d) return '';
  const distanceLabel = d.km < 1 ? `${Math.round(d.km * 1000)} m` : `${d.km.toFixed(1)} km`;
  const modeLabel = d.km < 5 ? `${d.mins} min walk` : `${d.mins} min drive`;
  return `${distanceLabel} · ${modeLabel}`;
}

export function pointDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return haversineKm(a, b);
}
