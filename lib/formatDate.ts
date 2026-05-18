// Region-aware date formatters. Use these instead of toLocaleDateString
// scattered everywhere. The helper delegates to Intl via the JS engine's
// built-in locale resolution (device default). expo-localization is not
// a dependency of this project so we rely on undefined locale, which the
// engine resolves to the device locale automatically.

export type DateLike = string | number | Date;
function toDate(input: DateLike): Date | null {
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDay(input: DateLike, opts?: { weekday?: boolean }): string {
  const d = toDate(input);
  if (!d) return String(input ?? '');
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(opts?.weekday ? { weekday: 'short' } : {}),
  });
}

export function formatLongDay(input: DateLike): string {
  const d = toDate(input);
  if (!d) return String(input ?? '');
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(input: DateLike): string {
  const d = toDate(input);
  if (!d) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatDayTime(input: DateLike): string {
  const d = toDate(input);
  if (!d) return String(input ?? '');
  return `${formatDay(input)} · ${formatTime(input)}`;
}

export function formatRange(start: DateLike, end: DateLike, opts?: { sameMonthCompact?: boolean }): string {
  const a = toDate(start);
  const b = toDate(end);
  if (!a) return formatDay(end);
  if (!b) return formatDay(start);
  if (opts?.sameMonthCompact && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    const dayA = a.toLocaleDateString(undefined, { day: 'numeric' });
    return `${dayA}–${formatDay(b)}`;
  }
  return `${formatDay(start)} → ${formatDay(end)}`;
}

export function formatWeekday(input: DateLike): string {
  const d = toDate(input);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { weekday: 'long' });
}

export function relativeFromNow(input: DateLike): string {
  // "in 5 days" / "today" / "tomorrow" / "yesterday" / "3 days ago"
  const d = toDate(input);
  if (!d) return '';
  const diffMs = d.getTime() - Date.now();
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 1 && days < 14) return `in ${days} days`;
  if (days < -1 && days > -14) return `${Math.abs(days)} days ago`;
  return formatDay(input);
}
