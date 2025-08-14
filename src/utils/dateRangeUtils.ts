import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear,
  subWeeks,
  subMonths,
  subDays,
  format
} from 'date-fns';
import { DateRange } from 'react-day-picker';

export interface CalculatedDateRange {
  from: Date;
  to: Date;
  label: string;
}

export const calculateDateRange = (timeRange: string, customDateRange?: DateRange): CalculatedDateRange => {
  const now = new Date();
  
  switch (timeRange) {
    case 'This Week':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }), // Monday start
        to: endOfWeek(now, { weekStartsOn: 1 }),
        label: 'This Week'
      };
    
    case 'Last Week':
      const lastWeekStart = subWeeks(now, 1);
      return {
        from: startOfWeek(lastWeekStart, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeekStart, { weekStartsOn: 1 }),
        label: 'Last Week'
      };
    
    case 'This Month':
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
        label: 'This Month'
      };
    
    case 'Last Month':
      const lastMonth = subMonths(now, 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
        label: 'Last Month'
      };
    
    case 'This Quarter':
      return {
        from: startOfQuarter(now),
        to: endOfQuarter(now),
        label: 'This Quarter'
      };
    
    case 'This Year':
      return {
        from: startOfYear(now),
        to: endOfYear(now),
        label: 'This Year'
      };
    
    case '7 days':
      return {
        from: subDays(now, 7),
        to: now,
        label: 'Last 7 Days'
      };
    
    case '30 days':
      return {
        from: subDays(now, 30),
        to: now,
        label: 'Last 30 Days'
      };
    
    case '90 days':
      return {
        from: subDays(now, 90),
        to: now,
        label: 'Last 90 Days'
      };
    
    case 'custom':
      if (customDateRange?.from && customDateRange?.to) {
        return {
          from: customDateRange.from,
          to: customDateRange.to,
          label: `${format(customDateRange.from, 'MMM dd, yyyy')} - ${format(customDateRange.to, 'MMM dd, yyyy')}`
        };
      }
      // Fallback to last 30 days if custom range is incomplete
      return {
        from: subDays(now, 30),
        to: now,
        label: 'Last 30 Days (Default)'
      };
    
    default:
      // Fallback to last 90 days
      return {
        from: subDays(now, 90),
        to: now,
        label: 'Last 90 Days (Default)'
      };
  }
};

export const formatDateRangeForDisplay = (range: CalculatedDateRange): string => {
  return `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`;
};

export const formatDateRangeForExport = (range: CalculatedDateRange): string => {
  return `${range.label} (${formatDateRangeForDisplay(range)})`;
};