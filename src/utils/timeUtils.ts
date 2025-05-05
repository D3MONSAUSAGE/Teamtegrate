
import { format, differenceInMinutes } from 'date-fns';

export const formatHoursMinutes = (minutes: number): string => {
  if (minutes === 0) return "0h";
  
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  } catch (e) {
    console.error('Invalid date:', dateString, e);
    return '';
  }
};

export const calculateDuration = (startTime: string, endTime: string | null | undefined): number | null => {
  if (!endTime) return null;
  
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return differenceInMinutes(end, start);
  } catch (e) {
    console.error('Duration calculation error:', e);
    return null;
  }
};

export const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes && minutes !== 0) return '';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const calculateBreakRequirements = (workedMinutes: number) => {
  // California labor law: 30min meal break for 5+ hours, 
  // second meal break for 10+ hours, 10min rest break per 4 hours
  
  // Calculate meal breaks (30 min each)
  const mealBreaks = Math.floor(workedMinutes / 300); // 5 hours = 300 minutes
  
  // Calculate rest breaks (10 min each)
  const restBreaks = Math.floor(workedMinutes / 240); // 4 hours = 240 minutes
  
  // Minutes that should be added to the total (not deducted from work time)
  const earnedBreakMinutes = (mealBreaks * 30) + (restBreaks * 10);
  
  return {
    mealBreaks,
    restBreaks,
    earnedBreakMinutes
  };
};
