/**
 * Reliable timezone utilities for handling local day boundaries
 */

/**
 * Returns UTC ISO boundaries for the local day (midnight..next midnight) in the specified timezone
 * This uses the offset calculation method for reliability across timezones and DST transitions
 */
export function getTZDayRangeUTC(tz: string, base: Date = new Date()): { startUTC: string; endUTC: string } {
  console.log('🕐 getTZDayRangeUTC input:', { tz, base, baseValid: base instanceof Date && !isNaN(base.getTime()) });
  
  // Validate inputs
  if (!tz || typeof tz !== 'string') {
    console.error('🕐 getTZDayRangeUTC: Invalid timezone:', tz);
    tz = 'UTC'; // Fallback to UTC
  }
  
  if (!base || !(base instanceof Date) || isNaN(base.getTime())) {
    console.error('🕐 getTZDayRangeUTC: Invalid base date:', base);
    base = new Date(); // Fallback to current date
  }

  try {
    // "base" as seen in the target TZ vs in UTC
    const localString = base.toLocaleString('en-US', { timeZone: tz });
    const utcString = base.toLocaleString('en-US', { timeZone: 'UTC' });
    
    const local = new Date(localString);
    const utc = new Date(utcString);
    
    console.log('🕐 getTZDayRangeUTC strings:', { localString, utcString });
    console.log('🕐 getTZDayRangeUTC dates:', { 
      local, utc, 
      localValid: !isNaN(local.getTime()), 
      utcValid: !isNaN(utc.getTime()) 
    });
    
    // Validate converted dates
    if (isNaN(local.getTime()) || isNaN(utc.getTime())) {
      throw new Error(`Invalid date conversion: local=${localString}, utc=${utcString}`);
    }
    
    // Offset between TZ and UTC *at this instant*
    const offsetMs = utc.getTime() - local.getTime();

    // Build local midnight..next midnight in that TZ
    const startLocal = new Date(local); 
    startLocal.setHours(0, 0, 0, 0);
    
    const endLocal = new Date(local); 
    endLocal.setDate(endLocal.getDate() + 1); // Add 1 day
    endLocal.setHours(0, 0, 0, 0); // Set to midnight of next day

    // Validate the calculated dates
    if (isNaN(startLocal.getTime()) || isNaN(endLocal.getTime())) {
      throw new Error(`Invalid calculated dates: startLocal=${startLocal}, endLocal=${endLocal}`);
    }

    const startUTCDate = new Date(startLocal.getTime() + offsetMs);
    const endUTCDate = new Date(endLocal.getTime() + offsetMs);
    
    // Final validation before toISOString
    if (isNaN(startUTCDate.getTime()) || isNaN(endUTCDate.getTime())) {
      throw new Error(`Invalid final dates: startUTC=${startUTCDate}, endUTC=${endUTCDate}`);
    }

    // Convert those local midnights to real UTC instants
    const result = {
      startUTC: startUTCDate.toISOString(),
      endUTC: endUTCDate.toISOString(),
    };
    
    console.log('🕐 getTZDayRangeUTC result:', result);
    return result;
  } catch (error) {
    console.error('🕐 getTZDayRangeUTC error:', error, { tz, base });
    // Fallback: return current day in UTC
    const fallbackStart = new Date(base);
    fallbackStart.setUTCHours(0, 0, 0, 0);
    const fallbackEnd = new Date(fallbackStart);
    fallbackEnd.setUTCDate(fallbackEnd.getUTCDate() + 1);
    
    return {
      startUTC: fallbackStart.toISOString(),
      endUTC: fallbackEnd.toISOString(),
    };
  }
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