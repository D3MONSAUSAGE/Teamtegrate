/**
 * Reliable timezone utilities for handling local day boundaries
 */

/**
 * Returns UTC ISO boundaries for the local day (midnight..next midnight) in the specified timezone
 * This uses the offset calculation method for reliability across timezones and DST transitions
 */
export function getTZDayRangeUTC(tz: string, base: Date = new Date()): { startUTC: string; endUTC: string } {
  // "base" as seen in the target TZ vs in UTC
  const local = new Date(base.toLocaleString('en-US', { timeZone: tz }));
  const utc = new Date(base.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  // Offset between TZ and UTC *at this instant*
  const offsetMs = utc.getTime() - local.getTime();

  // Build local midnight..next midnight in that TZ
  const startLocal = new Date(local); 
  startLocal.setHours(0, 0, 0, 0);
  
  const endLocal = new Date(local); 
  endLocal.setHours(24, 0, 0, 0);

  // Convert those local midnights to real UTC instants
  return {
    startUTC: new Date(startLocal.getTime() + offsetMs).toISOString(),
    endUTC: new Date(endLocal.getTime() + offsetMs).toISOString(),
  };
}

/**
 * Enhanced timezone-aware date formatter
 */
export function formatInTZ(iso: string, tz: string, opts?: Intl.DateTimeFormatOptions) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    dateStyle: 'medium',
    timeStyle: 'short',
    ...(opts || {})
  }).format(d);
}