import { useState, useEffect, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { calculateDateRange } from '@/utils/dateRangeUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import type { ReportFilter } from '@/types/reports';
import { format, startOfWeek } from 'date-fns';

interface ReportFiltersState {
  timeRange: string;
  dateRange?: DateRange;
  selectedTeamId: string | null;
  selectedUserId: string | null;
}

const STORAGE_KEY = 'report-filters';

export const useReportFilters = () => {
  const { user } = useAuth();
  const { userTimezone } = useUserTimezone();
  
  const [timeRange, setTimeRange] = useState('7 days');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Load filters from session storage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ReportFiltersState = JSON.parse(saved);
        setTimeRange(parsed.timeRange);
        setDateRange(parsed.dateRange);
        setSelectedTeamId(parsed.selectedTeamId);
        setSelectedUserId(parsed.selectedUserId);
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
        selectedTeamId,
        selectedUserId
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filtersState));
    } catch (error) {
      console.warn('Failed to save report filters:', error);
    }
  }, [timeRange, dateRange, selectedTeamId, selectedUserId]);

  // Calculate actual date range
  const calculatedDateRange = calculateDateRange(timeRange, dateRange);

  // Clear user when team changes and user not in team
  useEffect(() => {
    if (selectedTeamId && selectedUserId) {
      // TODO: Add team membership validation if needed
      // For now, keep the user selection when team changes
    }
  }, [selectedTeamId, selectedUserId]);

  // Memoized unified filter object
  const filter = useMemo<ReportFilter>(() => {
    const baseDate = dateRange?.from || new Date();
    const dateISO = format(baseDate, 'yyyy-MM-dd');
    const weekStartISO = format(startOfWeek(baseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    return {
      orgId: user?.organizationId || '',
      teamIds: selectedTeamId ? [selectedTeamId] : undefined,
      userId: selectedUserId || undefined,
      view: activeTab,
      dateISO,
      weekStartISO,
      timezone: userTimezone || 'UTC',
    };
  }, [
    user?.organizationId,
    selectedTeamId,
    selectedUserId,
    activeTab,
    dateRange?.from,
    userTimezone
  ]);

  return {
    // Legacy props for backward compatibility
    timeRange,
    dateRange,
    selectedTeamId,
    selectedUserId,
    calculatedDateRange,
    setTimeRange,
    setDateRange,
    setSelectedTeamId,
    setSelectedUserId,
    // New unified filter system
    filter,
    activeTab,
    setActiveTab,
  };
};