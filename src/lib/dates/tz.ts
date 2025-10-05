/**
 * Timezone utilities for handling user-aware date operations
 */

/**
 * Returns ISO strings (UTC) for the start/end of a given local day in the given timezone
 */
export function getLocalDayBoundsISO(timezone: string, day: Date = new Date()) {
  // Compute 00:00–23:59:59.999 in timezone, then convert to UTC ISO
  const toUTCISO = (y: number, m: number, d: number, h = 0, mi = 0, s = 0, ms = 0) => {
    const dt = new Date(Date.UTC(y, m, d, h, mi, s, ms));
    // Reinterpret the UTC fields as local-in-timezone using the offset trick
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(dt);
    
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value);
    const y2 = get('year');
    const m2 = get('month') - 1;
    const d2 = get('day');
    const hh = get('hour');
    const mm = get('minute');
    const ss = get('second');
    
    const local = new Date(Date.UTC(y2, m2, d2, hh, mm, ss, 0));
    return local.toISOString();
  };
  
  const y = day.getFullYear();
  const m = day.getMonth();
  const d = day.getDate();
  
  // Start/end of day in timezone → to UTC ISO strings
  const startUTC = toUTCISO(y, m, d, 0, 0, 0, 0);
  const endUTC = toUTCISO(y, m, d, 23, 59, 59, 999);
  
  return { startUTC, endUTC };
}

/**
 * Formats a timestamp in the user's timezone
 */
export function formatInTZ(iso: string | number | Date, timezone: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString(undefined, { timeZone: timezone, ...opts });
}

/**
 * Get the local date in a specific timezone (YYYY-MM-DD format)
 */
export function getLocalDateString(timezone: string, date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
}