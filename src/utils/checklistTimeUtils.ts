import { format, isAfter, isBefore, parseISO, differenceInMinutes, addDays } from 'date-fns';
import { Checklist, ChecklistExecution } from '@/types/checklist';

export interface TimeWindowStatus {
  isInWindow: boolean;
  isBeforeWindow: boolean;
  isAfterWindow: boolean;
  status: 'available' | 'upcoming' | 'expired' | 'no-window';
  timeUntilAvailable?: number; // minutes
  timeUntilExpired?: number; // minutes
  message: string;
}

/**
 * Checks if the current time is within a checklist's execution window
 */
export const getChecklistTimeWindowStatus = (
  checklist: Checklist | ChecklistExecution['checklist'], 
  executionDate?: string
): TimeWindowStatus => {
  if (!checklist) {
    return {
      isInWindow: false,
      isBeforeWindow: false,
      isAfterWindow: false,
      status: 'no-window',
      message: 'No checklist data available'
    };
  }

  // If no execution window is set, checklist is always available
  if (!checklist.execution_window_start || !checklist.execution_window_end) {
    return {
      isInWindow: true,
      isBeforeWindow: false,
      isAfterWindow: false,
      status: 'available',
      message: 'Available anytime'
    };
  }

  const now = new Date();
  const today = executionDate ? new Date(executionDate) : now;
  
  // Parse time strings (HH:mm format) and create Date objects for today
  const [startHour, startMinute] = checklist.execution_window_start.split(':').map(Number);
  const [endHour, endMinute] = checklist.execution_window_end.split(':').map(Number);
  
  const windowStart = new Date(today);
  windowStart.setHours(startHour, startMinute, 0, 0);
  
  const windowEnd = new Date(today);
  windowEnd.setHours(endHour, endMinute, 0, 0);
  
  // Handle overnight windows (end time is next day)
  if (windowEnd <= windowStart) {
    windowEnd.setDate(windowEnd.getDate() + 1);
  }
  
  const isInWindow = now >= windowStart && now <= windowEnd;
  const isBeforeWindow = now < windowStart;
  const isAfterWindow = now > windowEnd;
  
  let status: TimeWindowStatus['status'];
  let message: string;
  let timeUntilAvailable: number | undefined;
  let timeUntilExpired: number | undefined;
  
  if (isInWindow) {
    status = 'available';
    timeUntilExpired = differenceInMinutes(windowEnd, now);
    message = timeUntilExpired > 60 
      ? `Available for ${Math.floor(timeUntilExpired / 60)}h ${timeUntilExpired % 60}m`
      : `Available for ${timeUntilExpired}m`;
  } else if (isBeforeWindow) {
    status = 'upcoming';
    timeUntilAvailable = differenceInMinutes(windowStart, now);
    message = timeUntilAvailable > 60
      ? `Available in ${Math.floor(timeUntilAvailable / 60)}h ${timeUntilAvailable % 60}m`
      : `Available in ${timeUntilAvailable}m`;
  } else {
    status = 'expired';
    // Check if it will be available tomorrow
    const tomorrowStart = addDays(windowStart, 1);
    timeUntilAvailable = differenceInMinutes(tomorrowStart, now);
    message = timeUntilAvailable > 60
      ? `Next available in ${Math.floor(timeUntilAvailable / 60)}h ${timeUntilAvailable % 60}m`
      : `Next available in ${timeUntilAvailable}m`;
  }
  
  return {
    isInWindow,
    isBeforeWindow,
    isAfterWindow,
    status,
    timeUntilAvailable,
    timeUntilExpired,
    message
  };
};

/**
 * Checks if a checklist execution can be started based on time window and cutoff time
 */
export const canStartChecklistExecution = (
  execution: ChecklistExecution,
  respectTimeWindow: boolean = true
): { canStart: boolean; reason?: string } => {
  if (!execution.checklist) {
    return { canStart: false, reason: 'Checklist data not available' };
  }

  // Check if already started or completed
  if (execution.status !== 'pending') {
    return { canStart: execution.status === 'in_progress', reason: 'Already in progress or completed' };
  }

  if (!respectTimeWindow) {
    return { canStart: true };
  }

  const timeStatus = getChecklistTimeWindowStatus(execution.checklist, execution.execution_date);
  
  if (!timeStatus.isInWindow) {
    return { 
      canStart: false, 
      reason: timeStatus.status === 'upcoming' 
        ? `Not yet available. ${timeStatus.message}` 
        : `Time window expired. ${timeStatus.message}`
    };
  }

  // Check cutoff time if set
  if (execution.checklist.cutoff_time) {
    const now = new Date();
    const today = new Date(execution.execution_date);
    const [cutoffHour, cutoffMinute] = execution.checklist.cutoff_time.split(':').map(Number);
    
    const cutoffTime = new Date(today);
    cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0);
    
    if (now > cutoffTime) {
      return { 
        canStart: false, 
        reason: `Cutoff time (${execution.checklist.cutoff_time}) has passed` 
      };
    }
  }

  return { canStart: true };
};

/**
 * Formats time window for display
 */
export const formatTimeWindow = (startTime?: string, endTime?: string): string => {
  if (!startTime || !endTime) return 'No time restrictions';
  
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hour, minute);
    return format(date, 'h:mm a');
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

/**
 * Gets priority-based styling classes
 */
export const getTimeStatusStyling = (status: TimeWindowStatus['status']) => {
  switch (status) {
    case 'available':
      return {
        badge: 'bg-green-100 text-green-800 border-green-200',
        icon: 'text-green-500',
        ring: 'ring-green-200',
        glow: 'shadow-green-200'
      };
    case 'upcoming':
      return {
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: 'text-blue-500',
        ring: 'ring-blue-200',
        glow: 'shadow-blue-200'
      };
    case 'expired':
      return {
        badge: 'bg-red-100 text-red-800 border-red-200',
        icon: 'text-red-500',
        ring: 'ring-red-200',
        glow: 'shadow-red-200'
      };
    default:
      return {
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'text-gray-500',
        ring: 'ring-gray-200',
        glow: 'shadow-gray-200'
      };
  }
};

/**
 * Countdown hook utility for real-time updates
 */
export const getCountdownText = (minutes: number): string => {
  if (minutes <= 0) return 'Now available';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
};