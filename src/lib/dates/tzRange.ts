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
 * Sanitizes Intl.DateTimeFormat options to prevent conflicts between
 * dateStyle/timeStyle and individual component options
 */
function sanitizeIntlOpts(
  opts?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions | undefined {
  if (!opts) return undefined;
  
  const hasComponents = ['year', 'month', 'day', 'hour', 'minute', 'second', 'weekday']
    .some(k => k in opts);
    
  if (hasComponents) {
    // Remove style keys if component fields are present (they are mutually exclusive)
    const { dateStyle, timeStyle, ...rest } = opts;
    return rest;
  }
  
  return opts;
}

/**
 * Enhanced timezone-aware date formatter
 */
export function formatInTZ(iso: string, tz: string, opts?: Intl.DateTimeFormatOptions) {
  const d = new Date(iso);
  
  const safe = sanitizeIntlOpts(opts);
  const defaults: Intl.DateTimeFormatOptions = 
    safe ? {} : { dateStyle: 'medium', timeStyle: 'short' }; // only if caller didn't specify components
  
  try {
    const result = new Intl.DateTimeFormat('en-US', { 
      timeZone: tz, 
      ...defaults, 
      ...(safe || {}) 
    }).format(d);
    
    // Debug logging for format results
    console.log('🕐 formatInTZ result:', {
      input: { iso, tz, opts },
      utcDate: d.toISOString(),
      result,
      timezone: tz
    });
    
    return result;
  } catch (e) {
    console.error('🕐 formatInTZ invalid options:', { tz, defaults, safe });
    throw e;
  }
}