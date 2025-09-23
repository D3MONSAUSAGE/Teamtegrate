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
const STORAGE_VERSION = '1.1'; // Increment to clear old corrupted state

export const useReportFilters = () => {
  const { user } = useAuth();
  const { userTimezone } = useUserTimezone();
  
  // Default to null for superadmins/admins (All Teams view)
  const defaultTeamId = user && ['superadmin', 'admin'].includes(user.role) ? null : null;
  
  const [timeRange, setTimeRange] = useState('7 days');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(defaultTeamId);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Load filters from session storage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Check version and clear if outdated
        if (parsed.version !== STORAGE_VERSION) {
          console.log('Clearing outdated filter state');
          sessionStorage.removeItem(STORAGE_KEY);
          return;
        }
        
        setTimeRange(parsed.timeRange);
        setDateRange(parsed.dateRange);
        
        // For superadmins/admins, always default to null (All Teams) unless explicitly set
        if (user && ['superadmin', 'admin'].includes(user.role)) {
          setSelectedTeamId(parsed.selectedTeamId === undefined ? null : parsed.selectedTeamId);
        } else {
          setSelectedTeamId(parsed.selectedTeamId);
        }
        
        setSelectedUserId(parsed.selectedUserId);
      }
    } catch (error) {
      console.warn('Failed to load saved report filters:', error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [user?.role]);

  // Save filters to session storage when they change
  useEffect(() => {
    try {
      const filtersState = {
        version: STORAGE_VERSION,
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
    // Don't create filter if essential data is missing
    if (!user?.organizationId) {
      return {
        orgId: '',
        view: activeTab,
        dateISO: format(new Date(), 'yyyy-MM-dd'), // Use today's date as fallback
        weekStartISO: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        timezone: userTimezone || 'UTC'
      };
    }

    const baseDate = dateRange?.from || new Date();
    const dateISO = format(baseDate, 'yyyy-MM-dd');
    const weekStartISO = format(startOfWeek(baseDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const filterObj = {
      orgId: user.organizationId,
      teamIds: selectedTeamId ? [selectedTeamId] : undefined,
      userId: selectedUserId || undefined,
      view: activeTab,
      dateISO,
      weekStartISO,
      timezone: userTimezone || 'UTC',
    };

    // Debug logging
    console.log('🔍 Filter Debug:', {
      selectedTeamId,
      selectedUserId,
      teamIds: filterObj.teamIds,
      userId: filterObj.userId,
      userRole: user.role,
      dateISO: filterObj.dateISO
    });

    return filterObj;
  }, [
    user?.organizationId,
    user?.role,
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
    setActiveTab: (value: string) => setActiveTab(value as 'daily' | 'weekly'),
  };
};