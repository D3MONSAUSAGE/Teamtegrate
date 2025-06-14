
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, addDays, format } from 'date-fns';

export interface DailySummary {
  id: string;
  user_id: string;
  work_date: string;
  total_work_minutes: number;
  total_break_minutes: number;
  session_count: number;
  break_count: number;
  overtime_minutes: number;
  compliance_notes?: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
  organization_id: string;
}

export interface CurrentSession {
  isActive: boolean;
  sessionId?: string;
  clockInTime?: Date;
  elapsedMinutes: number;
  isOnBreak: boolean;
  breakType?: string;
  breakStartTime?: Date;
  breakElapsedMinutes: number;
}

export const useEmployeeTimeTracking = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<CurrentSession>({
    isActive: false,
    elapsedMinutes: 0,
    isOnBreak: false,
    breakElapsedMinutes: 0
  });
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [weeklyEntries, setWeeklyEntries] = useState<TimeEntry[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  // Auto-close stale sessions on load
  const autoCloseStaleSessionsAPI = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('auto_close_stale_sessions');
      if (error) {
        console.warn('Auto-close sessions warning:', error);
      }
    } catch (error) {
      console.warn('Auto-close sessions failed:', error);
    }
  }, []);

  // Fetch current active session
  const fetchCurrentSession = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const entry = data[0];
        const clockInTime = new Date(entry.clock_in);
        const elapsedMs = Date.now() - clockInTime.getTime();
        const elapsedMinutes = Math.floor(elapsedMs / 60000);

        // Check if this is a break session
        const isBreakSession = entry.notes?.toLowerCase().includes('break');
        
        setCurrentSession({
          isActive: !isBreakSession,
          sessionId: entry.id,
          clockInTime,
          elapsedMinutes: isBreakSession ? 0 : elapsedMinutes,
          isOnBreak: isBreakSession || false,
          breakType: isBreakSession ? entry.notes?.split(' ')[0] : undefined,
          breakStartTime: isBreakSession ? clockInTime : undefined,
          breakElapsedMinutes: isBreakSession ? elapsedMinutes : 0
        });
      } else {
        setCurrentSession({
          isActive: false,
          elapsedMinutes: 0,
          isOnBreak: false,
          breakElapsedMinutes: 0
        });
      }
    } catch (error) {
      console.error('Error fetching current session:', error);
      setLastError('Failed to fetch current session');
    }
  }, [user?.id]);

  // Fetch daily summary for today
  const fetchDailySummary = useCallback(async (date: Date = new Date()) => {
    if (!user?.id) return;

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_time_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('work_date', dateStr)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setDailySummary(data || null);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
    }
  }, [user?.id]);

  // Fetch weekly time entries
  const fetchWeeklyEntries = useCallback(async (weekStart?: Date) => {
    if (!user?.id) return;

    try {
      const start = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = addDays(start, 7);

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('clock_in', start.toISOString())
        .lt('clock_in', end.toISOString())
        .order('clock_in', { ascending: false });

      if (error) throw error;

      setWeeklyEntries(data || []);
    } catch (error) {
      console.error('Error fetching weekly entries:', error);
      setLastError('Failed to fetch weekly entries');
    }
  }, [user?.id]);

  // Clock in function
  const clockIn = useCallback(async (notes?: string) => {
    if (!user?.organizationId || isLoading) return;

    try {
      setIsLoading(true);
      setLastError(null);

      // Auto-close any stale sessions first
      await autoCloseStaleSessionsAPI();

      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user.id,
          organization_id: user.organizationId,
          notes: notes || null
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Clocked in successfully');
      await fetchCurrentSession();
      await fetchDailySummary();
      
    } catch (error) {
      console.error('Clock in error:', error);
      setLastError('Failed to clock in');
      toast.error('Failed to clock in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.organizationId, isLoading, autoCloseStaleSessionsAPI, fetchCurrentSession, fetchDailySummary]);

  // Clock out function
  const clockOut = useCallback(async (notes?: string) => {
    if (!currentSession.sessionId || isLoading) return;

    try {
      setIsLoading(true);
      setLastError(null);

      const { error } = await supabase
        .from('time_entries')
        .update({ 
          clock_out: new Date().toISOString(),
          notes: notes || null 
        })
        .eq('id', currentSession.sessionId);

      if (error) throw error;

      toast.success('Clocked out successfully');
      await fetchCurrentSession();
      await fetchDailySummary();
      await fetchWeeklyEntries();
      
    } catch (error) {
      console.error('Clock out error:', error);
      setLastError('Failed to clock out');
      toast.error('Failed to clock out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSession.sessionId, isLoading, fetchCurrentSession, fetchDailySummary, fetchWeeklyEntries]);

  // Start break function
  const startBreak = useCallback(async (breakType: 'Coffee' | 'Lunch' | 'Rest') => {
    if (!currentSession.isActive || isLoading) return;

    try {
      setIsLoading(true);
      setLastError(null);

      // Clock out current session and immediately start break session
      const now = new Date().toISOString();
      
      // End current work session
      await supabase
        .from('time_entries')
        .update({ clock_out: now })
        .eq('id', currentSession.sessionId);

      // Start break session
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user!.id,
          organization_id: user!.organizationId,
          clock_in: now,
          notes: `${breakType} break`
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(`${breakType} break started`);
      await fetchCurrentSession();
      
    } catch (error) {
      console.error('Start break error:', error);
      setLastError('Failed to start break');
      toast.error('Failed to start break. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSession.isActive, currentSession.sessionId, isLoading, user, fetchCurrentSession]);

  // End break function
  const endBreak = useCallback(async () => {
    if (!currentSession.isOnBreak || !currentSession.sessionId || isLoading) return;

    try {
      setIsLoading(true);
      setLastError(null);

      // End break session
      const now = new Date().toISOString();
      await supabase
        .from('time_entries')
        .update({ clock_out: now })
        .eq('id', currentSession.sessionId);

      // Start new work session
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user!.id,
          organization_id: user!.organizationId,
          clock_in: now,
          notes: 'Resumed from break'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Break ended, work session resumed');
      await fetchCurrentSession();
      await fetchDailySummary();
      
    } catch (error) {
      console.error('End break error:', error);
      setLastError('Failed to end break');
      toast.error('Failed to end break. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSession.isOnBreak, currentSession.sessionId, isLoading, user, fetchCurrentSession, fetchDailySummary]);

  // Real-time session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession.isActive && currentSession.clockInTime) {
      interval = setInterval(() => {
        const elapsedMs = Date.now() - currentSession.clockInTime!.getTime();
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        setCurrentSession(prev => ({ ...prev, elapsedMinutes }));
      }, 1000);
    } else if (currentSession.isOnBreak && currentSession.breakStartTime) {
      interval = setInterval(() => {
        const elapsedMs = Date.now() - currentSession.breakStartTime!.getTime();
        const breakElapsedMinutes = Math.floor(elapsedMs / 60000);
        setCurrentSession(prev => ({ ...prev, breakElapsedMinutes }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession.isActive, currentSession.isOnBreak, currentSession.clockInTime, currentSession.breakStartTime]);

  // Initialize data on mount
  useEffect(() => {
    if (user?.id) {
      autoCloseStaleSessionsAPI();
      fetchCurrentSession();
      fetchDailySummary();
      fetchWeeklyEntries();
    }
  }, [user?.id, autoCloseStaleSessionsAPI, fetchCurrentSession, fetchDailySummary, fetchWeeklyEntries]);

  // Real-time subscription for time entries
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('time_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchCurrentSession();
          fetchDailySummary();
          fetchWeeklyEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchCurrentSession, fetchDailySummary, fetchWeeklyEntries]);

  return {
    currentSession,
    dailySummary,
    weeklyEntries,
    isLoading,
    lastError,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    fetchDailySummary,
    fetchWeeklyEntries,
    autoCloseStaleSessionsAPI
  };
};
