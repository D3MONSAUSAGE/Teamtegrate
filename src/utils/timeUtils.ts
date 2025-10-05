
import { format, parseISO, differenceInMinutes } from 'date-fns';

export const formatTime12Hour = (dateString: string) => {
  return format(parseISO(dateString), 'h:mm a');
};

export const calculateBonusMinutes = (totalMinutes: number) => {
  // 8 hours = 480 minutes
  return totalMinutes >= 480 ? 20 : 10;
};

export const formatHoursMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

export const formatTimeWithSeconds = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

