import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, addDays, format } from 'date-fns';
import { notifications } from '@/lib/notifications';

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
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  approval_rejected_reason?: string;
}

export interface CurrentSession {
  isActive: boolean;
  sessionId?: string;
  clockInTime?: Date;
  elapsedMinutes: number;
  elapsedSeconds: number;
  isOnBreak: boolean;
  breakType?: string;
  breakStartTime?: Date;
  breakElapsedMinutes: number;
  breakElapsedSeconds: number;
}

interface TimeTrackingContextValue {
  currentSession: CurrentSession;
  dailySummary: DailySummary | null;
  weeklyEntries: TimeEntry[];
  isLoading: boolean;
  lastError: string | null;
  realtimeConnected: boolean;
  clockIn: (notes?: string, teamId?: string, shiftId?: string) => Promise<void>;
  clockOut: (notes?: string, breakMinutes?: number) => Promise<void>;
  startBreak: (breakType: 'Coffee' | 'Lunch' | 'Rest') => Promise<void>;
  endBreak: () => Promise<void>;
  fetchCurrentSession: () => Promise<void>;
  fetchDailySummary: (date?: Date) => Promise<void>;
  fetchWeeklyEntries: (weekStart?: Date) => Promise<void>;
  autoCloseStaleSessionsAPI: () => Promise<void>;
  approveTimeEntry: (entryId: string, notes?: string) => Promise<void>;
  rejectTimeEntry: (entryId: string, reason: string) => Promise<void>;
}

const TimeTrackingContext = createContext<TimeTrackingContextValue | undefined>(undefined);

export const TimeTrackingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<CurrentSession>({
    isActive: false,
    elapsedMinutes: 0,
    elapsedSeconds: 0,
    isOnBreak: false,
    breakElapsedMinutes: 0,
    breakElapsedSeconds: 0
  });
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [weeklyEntries, setWeeklyEntries] = useState<TimeEntry[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

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
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        const isBreakSession = entry.notes?.toLowerCase().includes('break');
        
        setCurrentSession({
          isActive: true,
          sessionId: entry.id,
          clockInTime: isBreakSession ? undefined : clockInTime,
          elapsedMinutes: isBreakSession ? 0 : elapsedMinutes,
          elapsedSeconds: isBreakSession ? 0 : elapsedSeconds,
          isOnBreak: isBreakSession || false,
          breakType: isBreakSession ? entry.notes?.split(' ')[0] : undefined,
          breakStartTime: isBreakSession ? clockInTime : undefined,
          breakElapsedMinutes: isBreakSession ? elapsedMinutes : 0,
          breakElapsedSeconds: isBreakSession ? elapsedSeconds : 0
        });
      } else {
        setCurrentSession({
          isActive: false,
          elapsedMinutes: 0,
          elapsedSeconds: 0,
          isOnBreak: false,
          breakElapsedMinutes: 0,
          breakElapsedSeconds: 0
        });
      }
    } catch (error) {
      console.error('Error fetching current session:', error);
      setLastError('Failed to fetch current session');
    }
  }, [user?.id]);

  // Fetch daily summary
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

  // Clock in
  const clockIn = useCallback(async (notes?: string, teamId?: string, shiftId?: string) => {
    if (!user?.organizationId || isLoading) return;

    try {
      setIsLoading(true);
      setLastError(null);

      await autoCloseStaleSessionsAPI();

      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user.id,
          organization_id: user.organizationId,
          team_id: teamId || null,
          shift_id: shiftId || null,
          notes: notes || null
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Clocked in successfully');
      await fetchCurrentSession();
      await fetchDailySummary();

      try {
        await notifications.notifyTimeEntryOpened({
          orgId: user.organizationId,
          teamId: teamId || null,
          entry: {
            id: data.id,
            user_id: user.id,
            user_name: user.name,
            clock_in: data.clock_in,
            notes: data.notes || undefined,
            team_name: teamId ? 'Team' : undefined,
            shift_id: data.shift_id || undefined
          },
          actor: {
            id: user.id,
            name: user.name || user.email,
            email: user.email
          }
        });
      } catch (notificationError) {
        console.warn('Failed to send clock-in notification:', notificationError);
      }
      
    } catch (error) {
      console.error('Clock in error:', error);
      setLastError('Failed to clock in');
      toast.error('Failed to clock in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading, autoCloseStaleSessionsAPI, fetchCurrentSession, fetchDailySummary]);

  // Clock out
  const clockOut = useCallback(async (notes?: string, breakMinutes: number = 0) => {
    if (!currentSession.sessionId || isLoading) return;

    try {
      setIsLoading(true);
      setLastError(null);

      const clockOutTime = new Date().toISOString();
      const { data, error } = await supabase
        .from('time_entries')
        .update({ 
          clock_out: clockOutTime,
          notes: notes || null 
        })
        .eq('id', currentSession.sessionId)
        .select(`
          *,
          users!user_id (
            name, email
          )
        `)
        .single();

      if (error) throw error;

      toast.success('Clocked out successfully');
      await fetchCurrentSession();
      await fetchDailySummary();
      await fetchWeeklyEntries();

      try {
        const clockInTime = new Date(data.clock_in);
        const clockOutTimeObj = new Date(clockOutTime);
        const durationMinutes = Math.floor((clockOutTimeObj.getTime() - clockInTime.getTime()) / 60000);

        await notifications.notifyTimeEntryClosed({
          orgId: user!.organizationId,
          teamId: data.team_id || null,
          entry: {
            id: data.id,
            user_id: user!.id,
            user_name: user!.name,
            clock_in: data.clock_in,
            clock_out: clockOutTime,
            duration_minutes: durationMinutes,
            notes: data.notes || undefined,
            team_name: data.team_id ? 'Team' : undefined,
            shift_id: data.shift_id || undefined
          },
          actor: {
            id: user!.id,
            name: user!.name || user!.email,
            email: user!.email
          }
        });

        await notifications.notifyTimeEntryNeedsApproval({
          orgId: user!.organizationId,
          teamId: data.team_id || null,
          entry: {
            id: data.id,
            user_id: user!.id,
            user_name: user!.name,
            duration_minutes: durationMinutes,
            work_date: format(new Date(), 'yyyy-MM-dd'),
            notes: data.notes || undefined
          },
          actor: {
            id: user!.id,
            name: user!.name || user!.email,
            email: user!.email
          }
        });
      } catch (notificationError) {
        console.warn('Failed to send notifications:', notificationError);
      }
      
    } catch (error) {
      console.error('Clock out error:', error);
      setLastError('Failed to clock out');
      toast.error('Failed to clock out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSession.sessionId, isLoading, user, fetchCurrentSession, fetchDailySummary, fetchWeeklyEntries]);

  // Start break
  const startBreak = useCallback(async (breakType: 'Coffee' | 'Lunch' | 'Rest') => {
    if (!currentSession.isActive || isLoading) return;

    try {
      setIsLoading(true);
      setLastError(null);

      const now = new Date().toISOString();
      
      await supabase
        .from('time_entries')
        .update({ clock_out: now })
        .eq('id', currentSession.sessionId);

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

  // End break
  const endBreak = useCallback(async () => {
    if (!currentSession.isOnBreak || !currentSession.sessionId || isLoading) return;

    try {
      setIsLoading(true);
      setLastError(null);

      const now = new Date().toISOString();
      await supabase
        .from('time_entries')
        .update({ clock_out: now })
        .eq('id', currentSession.sessionId);

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

  // Approve time entry
  const approveTimeEntry = useCallback(async (entryId: string, notes?: string) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('manage_time_entry_approval', {
        entry_id: entryId,
        manager_id: user.id,
        new_status: 'approved',
        approval_notes_text: notes || null
      }) as { data: { success?: boolean; error?: string }, error: any };

      if (error) throw error;
      
      if (data?.success) {
        toast.success('Time entry approved');
        await fetchWeeklyEntries();
        
        try {
          const { data: entryData } = await supabase
            .from('time_entries')
            .select('user_id, duration_minutes, clock_in')
            .eq('id', entryId)
            .single();
          
          if (entryData) {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                type: 'time_entry_approved',
                organization_id: user.organizationId,
                user_ids: [entryData.user_id],
                title: 'Time Entry Approved',
                body: `Your time entry for ${Math.round((entryData.duration_minutes || 0) / 60 * 10) / 10} hours has been approved`,
                data: {
                  entry_id: entryId,
                  route: '/dashboard/time-tracking'
                }
              }
            });
          }
        } catch (pushError) {
          console.warn('Failed to send push notification:', pushError);
        }
      } else {
        throw new Error(data?.error);
      }
    } catch (error) {
      console.error('Error approving entry:', error);
      toast.error('Failed to approve time entry');
    }
  }, [user, fetchWeeklyEntries]);

  // Reject time entry
  const rejectTimeEntry = useCallback(async (entryId: string, reason: string) => {
    if (!user?.id || !reason) return;
    
    try {
      const { data, error } = await supabase.rpc('manage_time_entry_approval', {
        entry_id: entryId,
        manager_id: user.id,
        new_status: 'rejected',
        rejection_reason: reason
      }) as { data: { success?: boolean; error?: string }, error: any };

      if (error) throw error;
      
      if (data?.success) {
        toast.success('Time entry rejected');
        await fetchWeeklyEntries();
        
        try {
          const { data: entryData } = await supabase
            .from('time_entries')
            .select('user_id, duration_minutes, clock_in')
            .eq('id', entryId)
            .single();
          
          if (entryData) {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                type: 'time_entry_rejected',
                organization_id: user.organizationId,
                user_ids: [entryData.user_id],
                title: 'Time Entry Rejected',
                body: `Your time entry has been rejected. Reason: ${reason}`,
                data: {
                  entry_id: entryId,
                  route: '/dashboard/time-tracking'
                }
              }
            });
          }
        } catch (pushError) {
          console.warn('Failed to send push notification:', pushError);
        }
      } else {
        throw new Error(data?.error);
      }
    } catch (error) {
      console.error('Error rejecting entry:', error);
      toast.error('Failed to reject time entry');
    }
  }, [user, fetchWeeklyEntries]);

  // Real-time session timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession.isActive && currentSession.clockInTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const clockInMs = currentSession.clockInTime!.getTime();
        const elapsedMs = now - clockInMs;
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        setCurrentSession(prev => ({ ...prev, elapsedMinutes, elapsedSeconds }));
      }, 1000);
    } else if (currentSession.isOnBreak && currentSession.breakStartTime) {
      interval = setInterval(() => {
        const elapsedMs = Date.now() - currentSession.breakStartTime!.getTime();
        const breakElapsedMinutes = Math.floor(elapsedMs / 60000);
        const breakElapsedSeconds = Math.floor(elapsedMs / 1000);
        
        setCurrentSession(prev => ({ ...prev, breakElapsedMinutes, breakElapsedSeconds }));
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

  // SINGLE real-time subscription for entire app
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔌 TimeTrackingContext: Setting up SINGLE real-time subscription');

    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const maxRetries = 5;
    let backoffMs = 1000;

    const setupChannel = () => {
      const channel = supabase
        .channel('time_tracking_global', {
          config: {
            broadcast: { self: false },
            presence: { key: user.id }
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'time_entries',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('✅ TimeTrackingContext: Real-time event received:', payload.eventType);
            retryCount = 0;
            backoffMs = 1000;
            
            if (payload.eventType === 'INSERT') {
              const newEntry = payload.new as TimeEntry;
              const clockInTime = new Date(newEntry.clock_in);
              const isBreakSession = newEntry.notes?.toLowerCase().includes('break');
              
              setCurrentSession({
                isActive: true,
                sessionId: newEntry.id,
                clockInTime: isBreakSession ? undefined : clockInTime,
                elapsedMinutes: 0,
                elapsedSeconds: 0,
                isOnBreak: isBreakSession || false,
                breakType: isBreakSession ? newEntry.notes?.split(' ')[0] : undefined,
                breakStartTime: isBreakSession ? clockInTime : undefined,
                breakElapsedMinutes: 0,
                breakElapsedSeconds: 0
              });
              
              setRealtimeConnected(true);
              
              setTimeout(() => {
                fetchCurrentSession();
                fetchDailySummary();
              }, 100);
            } else if (payload.eventType === 'UPDATE') {
              const updatedEntry = payload.new as TimeEntry;
              
              if (updatedEntry.clock_out) {
                setCurrentSession({
                  isActive: false,
                  elapsedMinutes: 0,
                  elapsedSeconds: 0,
                  isOnBreak: false,
                  breakElapsedMinutes: 0,
                  breakElapsedSeconds: 0
                });
              }
            } else if (payload.eventType === 'DELETE') {
              setCurrentSession({
                isActive: false,
                elapsedMinutes: 0,
                elapsedSeconds: 0,
                isOnBreak: false,
                breakElapsedMinutes: 0,
                breakElapsedSeconds: 0
              });
            }
            
            await Promise.all([
              fetchCurrentSession(),
              fetchDailySummary(),
              fetchWeeklyEntries()
            ]);
          }
        )
        .subscribe((status) => {
          console.log('📡 TimeTrackingContext: Real-time status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ TimeTrackingContext: Real-time connected');
            setRealtimeConnected(true);
            retryCount = 0;
            backoffMs = 1000;
          } else if (status === 'CLOSED' && retryCount < maxRetries) {
            setRealtimeConnected(false);
            console.warn(`⚠️ TimeTrackingContext: Connection closed, retry ${retryCount + 1}/${maxRetries} in ${backoffMs}ms`);
            retryCount++;
            retryTimeout = setTimeout(() => {
              supabase.removeChannel(channel);
              setupChannel();
            }, backoffMs);
            backoffMs = Math.min(backoffMs * 2, 10000); // Exponential backoff, max 10s
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ TimeTrackingContext: Real-time error');
            setLastError('Real-time updates unavailable');
          } else if (retryCount >= maxRetries) {
            console.error('❌ TimeTrackingContext: Max retries reached');
            setRealtimeConnected(false);
          }
        });

      return channel;
    };

    const channel = setupChannel();

    return () => {
      console.log('🔌 TimeTrackingContext: Cleaning up real-time subscription');
      if (retryTimeout) clearTimeout(retryTimeout);
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchCurrentSession, fetchDailySummary, fetchWeeklyEntries]);

  // Polling fallback
  useEffect(() => {
    if (!user?.id) return;

    const pollingInterval = setInterval(async () => {
      if (!realtimeConnected || currentSession.isActive) {
        await fetchCurrentSession();
      }
    }, 10000); // Poll every 10 seconds (reduced frequency)

    return () => clearInterval(pollingInterval);
  }, [user?.id, realtimeConnected, currentSession.isActive, fetchCurrentSession]);

  const value: TimeTrackingContextValue = {
    currentSession,
    dailySummary,
    weeklyEntries,
    isLoading,
    lastError,
    realtimeConnected,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    fetchCurrentSession,
    fetchDailySummary,
    fetchWeeklyEntries,
    autoCloseStaleSessionsAPI,
    approveTimeEntry,
    rejectTimeEntry
  };

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  );
};

export const useTimeTracking = (): TimeTrackingContextValue => {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error('useTimeTracking must be used within TimeTrackingProvider');
  }
  return context;
};
