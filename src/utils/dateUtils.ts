/**
 * Converts a Date object to datetime-local input format
 * This handles timezone issues that occur with toISOString()
 */
export const toDateTimeLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Validates that end time is after start time
 */
export const validateTimeRange = (startTime: string, endTime: string): boolean => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return end > start;
};

/**
 * Validates that the date is not in the past
 */
export const validateFutureDate = (dateTime: string): boolean => {
  const selected = new Date(dateTime);
  const now = new Date();
  return selected > now;
};

/**
 * Adds specified minutes to a date string and returns formatted datetime-local string
 */
export const addMinutesToDateTime = (dateTime: string, minutes: number): string => {
  const date = new Date(dateTime);
  date.setMinutes(date.getMinutes() + minutes);
  return toDateTimeLocalString(date);
};