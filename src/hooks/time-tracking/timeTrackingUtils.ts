
import { format, startOfWeek, addDays, differenceInMinutes } from 'date-fns';

export interface TimeEntry {
  clock_in: string;
  clock_out?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
}

export interface WeeklyChartData {
  day: string;
  totalHours: number;
}

// Get week range from a date
export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return { start, end };
}

// Format duration in milliseconds to HH:MM:SS
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : n.toString());
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Filter entries by date
export function filterDailyEntries(entries: TimeEntry[], date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  console.log('Filtering entries for date:', dateStr);
  
  return entries.filter(entry => {
    try {
      const entryDate = format(new Date(entry.clock_in), 'yyyy-MM-dd');
      const match = entryDate === dateStr;
      return match;
    } catch (error) {
      console.error('Error filtering entry:', error, entry);
      return false;
    }
  });
}

// Calculate total minutes from time entries
export function calculateTotalMinutes(entries: TimeEntry[]): number {
  return entries.reduce((total, entry) => {
    if (entry.duration_minutes) {
      return total + entry.duration_minutes;
    } else if (entry.clock_out) {
      const minutesDiff = differenceInMinutes(
        new Date(entry.clock_out),
        new Date(entry.clock_in)
      );
      return total + minutesDiff;
    }
    return total;
  }, 0);
}
