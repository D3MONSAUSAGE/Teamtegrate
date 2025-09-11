import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { calculateDateRange } from '@/utils/dateRangeUtils';

interface ReportFiltersState {
  timeRange: string;
  dateRange?: DateRange;
  selectedTeamId: string | null;
}

const STORAGE_KEY = 'report-filters';

export const useReportFilters = () => {
  const [timeRange, setTimeRange] = useState('30 days');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Load filters from session storage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ReportFiltersState = JSON.parse(saved);
        setTimeRange(parsed.timeRange);
        setDateRange(parsed.dateRange);
        setSelectedTeamId(parsed.selectedTeamId);
      }
    } catch (error) {
      console.warn('Failed to load saved report filters:', error);
    }
  }, []);

  // Save filters to session storage when they change
  useEffect(() => {
    try {
      const filtersState: ReportFiltersState = {
        timeRange,
        dateRange,
        selectedTeamId
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filtersState));
    } catch (error) {
      console.warn('Failed to save report filters:', error);
    }
  }, [timeRange, dateRange, selectedTeamId]);

  // Calculate actual date range
  const calculatedDateRange = calculateDateRange(timeRange, dateRange);

  return {
    timeRange,
    dateRange,
    selectedTeamId,
    calculatedDateRange,
    setTimeRange,
    setDateRange,
    setSelectedTeamId
  };
};