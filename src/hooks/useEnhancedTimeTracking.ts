
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfDay, differenceInMinutes } from 'date-fns';

export interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: Date;
  clock_out?: Date;
  duration_minutes?: number;
  notes?: string;
  created_at: Date;
  organization_id: string;
}

export interface SessionState {
  isActive: boolean;
  isOnBreak: boolean;
  breakType?: 'Coffee' | 'Lunch' | 'Rest';
  sessionId?: string;
  clockInTime?: Date;
  breakStartTime?: Date;
  workElapsedMinutes: number;
  breakElapsedMinutes: number;
  totalWorkedToday: number;
  totalBreakToday: number;
}

export interface BreakRequirements {
  canTakeBreak: boolean;
  requiresMealBreak: boolean;
  suggestedBreakType?: 'Coffee' | 'Lunch' | 'Rest';
  nextBreakIn?: number; // minutes
  complianceMessage?: string;
}

export const useEnhancedTimeTracking = () => {
  const { user } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    isOnBreak: false,
    workElapsedMinutes: 0,
    breakElapsedMinutes: 0,
    totalWorkedToday: 0,
    totalBreakToday: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<Date | null>(null);

  // Calculate break requirements based on current work time - Made more practical for testing
  const getBreakRequirements = useCallback((): BreakRequirements => {
    const totalWorked = sessionState.totalWorkedToday + sessionState.workElapsedMinutes;
    
    // Allow breaks after 30 minutes for better UX and testing
    if (totalWorked < 30) {
      return {
        canTakeBreak: false,
        requiresMealBreak: false,
        complianceMessage: 'Work 30+ minutes to earn your first break'
      };
    }
    
    // Require meal break after 5+ hours (300 minutes)
    if (totalWorked >= 300 && sessionState.totalBreakToday < 30) {
      return {
        canTakeBreak: true,
        requiresMealBreak: true,
        suggestedBreakType: 'Lunch',
        complianceMessage: 'Meal break required after 5 hours of work'
      };
    }
    
    // Allow any break after 2+ hours (120 minutes)
    if (totalWorked >= 120) {
      return {
        canTakeBreak: true,
        requiresMealBreak: false,
        suggestedBreakType: totalWorked >= 300 ? 'Lunch' : 'Coffee',
        complianceMessage: 'You\'ve earned break time!'
      };
    }
    
    // Allow basic breaks after 30 minutes
    return {
      canTakeBreak: true,
      requiresMealBreak: false,
      suggestedBreakType: 'Coffee',
      complianceMessage: 'Short break available'
    };
  }, [sessionState.totalWorkedToday, sessionState.workElapsedMinutes, sessionState.totalBreakToday]);

  // Fetch current session and today's entries
  const fetchCurrentState = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = startOfDay(new Date());
      
      // Get all entries for today
      const { data: entries, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('clock_in', today.toISOString())
        .order('clock_in', { ascending: true });

      if (error) throw error;

      const mappedEntries: TimeEntry[] = entries?.map(entry => ({
        id: entry.id,
        user_id: entry.user_id,
        clock_in: new Date(entry.clock_in),
        clock_out: entry.clock_out ? new Date(entry.clock_out) : undefined,
        duration_minutes: entry.duration_minutes,
        notes: entry.notes,
        created_at: new Date(entry.created_at),
        organization_id: entry.organization_id
      })) || [];

      setTodayEntries(mappedEntries);

      // Calculate today's totals
      let totalWorked = 0;
      let totalBreak = 0;
      let activeSession: TimeEntry | undefined;

      mappedEntries.forEach(entry => {
        if (!entry.clock_out) {
          activeSession = entry;
          return;
        }
        
        const duration = entry.duration_minutes || 0;
        const isBreak = entry.notes?.toLowerCase().includes('break') || false;
        
        if (isBreak) {
          totalBreak += duration;
        } else {
          totalWorked += duration;
        }
      });

      // Determine current state
      if (activeSession) {
        const isBreakSession = activeSession.notes?.toLowerCase().includes('break') || false;
        const startTime = activeSession.clock_in;
        startTimeRef.current = startTime;

        setSessionState(prev => ({
          ...prev,
          isActive: true, // Always true when we have an active session (work or break)
          isOnBreak: isBreakSession,
          breakType: isBreakSession ? 
            (activeSession.notes?.includes('Lunch') ? 'Lunch' : 
             activeSession.notes?.includes('Coffee') ? 'Coffee' : 'Rest') : undefined,
          sessionId: activeSession.id,
          clockInTime: isBreakSession ? undefined : startTime,
          breakStartTime: isBreakSession ? startTime : undefined,
          totalWorkedToday: totalWorked,
          totalBreakToday: totalBreak,
        }));
      } else {
        startTimeRef.current = null;
        setSessionState(prev => ({
          ...prev,
          isActive: false,
          isOnBreak: false,
          sessionId: undefined,
          clockInTime: undefined,
          breakStartTime: undefined,
          workElapsedMinutes: 0,
          breakElapsedMinutes: 0,
          totalWorkedToday: totalWorked,
          totalBreakToday: totalBreak,
        }));
      }
    } catch (error) {
      console.error('Error fetching current state:', error);
      setLastError('Failed to fetch current state');
    }
  }, [user?.id]);

  // Clock in for work
  const clockIn = useCallback(async (notes?: string) => {
    if (!user?.organizationId || isLoading) return;

    try {
      setIsLoading(true);
      setLastError(null);

      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user.id,
          organization_id: user.organizationId,
          notes: notes || 'Work session'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Clocked in successfully');
      await fetchCurrentState();
    } catch (error) {
      console.error('Clock in error:', error);
      setLastError('Failed to clock in');
      toast.error('Failed to clock in');
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading, fetchCurrentState]);

  // Clock out
  const clockOut = useCallback(async (notes?: string) => {
    if (!sessionState.sessionId || isLoading) return;

    try {
      setIsLoading(true);
      setLastError(null);

      const { error } = await supabase
        .from('time_entries')
        .update({ 
          clock_out: new Date().toISOString(),
          notes: notes || (sessionState.isOnBreak ? `${sessionState.breakType} break` : 'Work session')
        })
        .eq('id', sessionState.sessionId);

      if (error) throw error;

      toast.success(sessionState.isOnBreak ? 'Break ended' : 'Clocked out successfully');
      await fetchCurrentState();
    } catch (error) {
      console.error('Clock out error:', error);
      setLastError('Failed to clock out');
      toast.error('Failed to clock out');
    } finally {
      setIsLoading(false);
    }
  }, [sessionState.sessionId, sessionState.isOnBreak, sessionState.breakType, isLoading, fetchCurrentState]);

  // Start a break
  const startBreak = useCallback(async (breakType: 'Coffee' | 'Lunch' | 'Rest') => {
    if (!sessionState.isActive || sessionState.isOnBreak || isLoading || !user?.organizationId) return;

    console.log('Starting break:', breakType, 'Current state:', sessionState);

    try {
      setIsLoading(true);
      setLastError(null);

      // End current work session
      if (sessionState.sessionId) {
        await supabase
          .from('time_entries')
          .update({ clock_out: new Date().toISOString() })
          .eq('id', sessionState.sessionId);
      }

      // Start break session
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user!.id,
          organization_id: user!.organizationId,
          notes: `${breakType} break`
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(`${breakType} break started`);
      await fetchCurrentState();
    } catch (error) {
      console.error('Start break error:', error);
      setLastError('Failed to start break');
      toast.error(`Failed to start ${breakType.toLowerCase()} break. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }, [sessionState.isActive, sessionState.sessionId, user, isLoading, fetchCurrentState]);

  // Resume work from break
  const resumeWork = useCallback(async () => {
    if (!sessionState.isOnBreak || isLoading || !user?.organizationId) return;

    try {
      setIsLoading(true);
      setLastError(null);

      // End break session
      if (sessionState.sessionId) {
        await supabase
          .from('time_entries')
          .update({ clock_out: new Date().toISOString() })
          .eq('id', sessionState.sessionId);
      }

      // Start new work session
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user!.id,
          organization_id: user!.organizationId,
          notes: `Resumed from ${sessionState.breakType} break`
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success(`Resumed from ${sessionState.breakType} break`);
      await fetchCurrentState();
    } catch (error) {
      console.error('Resume work error:', error);
      setLastError('Failed to resume work');
      toast.error('Failed to resume work. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionState.isOnBreak, sessionState.sessionId, sessionState.breakType, user, isLoading, fetchCurrentState]);

  // Fixed real-time timer updates
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Only start timer if we have an active session and a start time
    if ((sessionState.isActive || sessionState.isOnBreak) && startTimeRef.current) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const startTime = startTimeRef.current!.getTime();
        const elapsedMinutes = Math.floor((now - startTime) / 60000);

        setSessionState(prev => {
          if (prev.isActive) {
            return { ...prev, workElapsedMinutes: elapsedMinutes };
          } else if (prev.isOnBreak) {
            return { ...prev, breakElapsedMinutes: elapsedMinutes };
          }
          return prev;
        });
      }, 1000); // Update every second for real-time feel
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState.isActive, sessionState.isOnBreak]); // Minimal dependencies to prevent timer restarts

  // Initialize on mount
  useEffect(() => {
    if (user?.id) {
      fetchCurrentState();
    }
  }, [user?.id, fetchCurrentState]);

  return {
    sessionState,
    todayEntries,
    breakRequirements: getBreakRequirements(),
    isLoading,
    lastError,
    clockIn,
    clockOut,
    startBreak,
    resumeWork,
    refreshState: fetchCurrentState
  };
};
