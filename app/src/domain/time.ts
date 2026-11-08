export type Instant = number;
export const DAY_MS = 86400000;
export function chinaDay(time: Instant): string { return new Date(time + 8 * 3600000).toISOString().slice(0,10); }
export function weekStart(time: Instant): string {
  const date = new Date(time + 8 * 3600000);
  const days = (date.getUTCDay() + 6) % 7;
  return chinaDay(time - days * DAY_MS);
}
export function weekInterval(day: string): { start: Instant; end: Instant } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const time = Date.parse(day + 'T00:00:00.000Z');
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0,10)!==day || new Date(time).getUTCDay()!==1) return null;
  const start = time - 8 * 3600000; return { start, end: start + 7 * DAY_MS };
}
