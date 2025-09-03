import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export interface ScheduleEntry {
  id: string;
  employee_id: string;
  team_id?: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  status: string;
  employee?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

export interface TimeEntryData {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string;
  duration_minutes?: number;
  notes?: string;
  team_id?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CoverageData {
  schedules: ScheduleEntry[];
  timeEntries: TimeEntryData[];
  lastUpdated: Date;
}

export const useScheduleCoverageData = () => {
  const { user } = useAuth();
  const [coverageData, setCoverageData] = useState<CoverageData>({
    schedules: [],
    timeEntries: [],
    lastUpdated: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRangeRef = useRef<{ start: string; end: string; teamId?: string } | null>(null);

  const fetchCoverageData = useCallback(async (selectedWeek: Date, teamId?: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const weekStart = format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      
      lastRangeRef.current = { start: weekStart, end: weekEnd, teamId };

      // Fetch scheduled data
      let schedulesQuery = supabase
        .from('employee_schedules')
        .select(`
          id,
          employee_id,
          team_id,
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          actual_start_time,
          actual_end_time,
          status,
          users!employee_id (
            id,
            name,
            email,
            avatar_url
          ),
          teams!team_id (
            id,
            name
          )
        `)
        .gte('scheduled_date', weekStart)
        .lte('scheduled_date', weekEnd)
        .order('scheduled_start_time', { ascending: true });

      if (teamId) {
        schedulesQuery = schedulesQuery.eq('team_id', teamId);
      }

      // Fetch actual time entries for the same period
      let timeEntriesQuery = supabase
        .from('time_entries')
        .select(`
          id,
          user_id,
          clock_in,
          clock_out,
          duration_minutes,
          notes,
          team_id
        `)
        .gte('clock_in', `${weekStart}T00:00:00Z`)
        .lte('clock_in', `${weekEnd}T23:59:59Z`)
        .not('notes', 'ilike', '%break%') // Exclude break entries
        .order('clock_in', { ascending: true });

      if (teamId) {
        timeEntriesQuery = timeEntriesQuery.eq('team_id', teamId);
      }

      const [schedulesResult, timeEntriesResult] = await Promise.all([
        schedulesQuery,
        timeEntriesQuery
      ]);

      if (schedulesResult.error) throw schedulesResult.error;
      if (timeEntriesResult.error) throw timeEntriesResult.error;

      // Enrich time entries with user data (manual join to avoid FK to auth.users)
      const rawTimeEntries = (timeEntriesResult.data || []) as TimeEntryData[];
      const userIds = Array.from(new Set(rawTimeEntries.map(te => te.user_id).filter(Boolean)));

      let usersById: Record<string, { id: string; name: string; email: string; avatar_url?: string }> = {};
      if (userIds.length > 0) {
        const usersResult = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', userIds);
        if (usersResult.error) throw usersResult.error;
        usersById = Object.fromEntries((usersResult.data || []).map(u => [u.id, u]));
      }

      const enrichedTimeEntries: TimeEntryData[] = rawTimeEntries.map(te => ({
        ...te,
        user: usersById[te.user_id] || undefined
      }));

      setCoverageData({
        schedules: schedulesResult.data || [],
        timeEntries: enrichedTimeEntries,
        lastUpdated: new Date()
      });

    } catch (err) {
      console.error('Error fetching coverage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch coverage data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Real-time subscription for both schedules and time entries
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schedule_coverage_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_schedules' },
        () => {
          const last = lastRangeRef.current;
          if (last) {
            fetchCoverageData(new Date(last.start), last.teamId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_entries' },
        () => {
          const last = lastRangeRef.current;
          if (last) {
            fetchCoverageData(new Date(last.start), last.teamId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCoverageData]);

  return {
    coverageData,
    isLoading,
    error,
    fetchCoverageData,
    refetch: () => {
      const last = lastRangeRef.current;
      if (last) {
        fetchCoverageData(new Date(last.start), last.teamId);
      }
    }
  };
};