import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, addDays } from 'date-fns';
import { requestManager, debounce } from '@/utils/requestManager';
import { useConnectionStatus } from './useConnectionStatus';

export interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: Date;
  clock_out?: Date;
  duration_minutes?: number;
  notes?: string;
  created_at: Date;
  organizationId: string;
}

export interface CurrentEntryState {
  isClocked: boolean;
  clock_in?: Date;
  id?: string;
}

export function useTimeTracking() {
  const { user } = useAuth();
  const { isOnline, setConnecting } = useConnectionStatus();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<CurrentEntryState>({ isClocked: false });
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const subscriptionRef = useRef<any>(null);

  // Create request keys for deduplication
  const createRequestKey = useCallback((type: string, params?: Record<string, any>) => {
    const baseKey = `${user?.id}-${user?.organizationId}-${type}`;
    return params ? `${baseKey}-${JSON.stringify(params)}` : baseKey;
  }, [user?.id, user?.organizationId]);

  // Enhanced fetch with better error handling
  const fetchTimeEntries = useCallback(async (showLoading = true) => {
    if (!user?.organizationId || fetchingRef.current) return;

    const requestKey = createRequestKey('fetch-entries');
    
    try {
      fetchingRef.current = true;
      if (showLoading) setIsLoading(true);
      setConnecting(true);
      setLastError(null);

      const data = await requestManager.dedupe(requestKey, async () => {
        console.log('Fetching time entries...');
        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', user.organizationId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      });

      if (!data) {
        console.warn('No data returned from time entries fetch');
        return;
      }

      const entries: TimeEntry[] = data.map(entry => ({
        id: entry.id,
        user_id: entry.user_id,
        clock_in: new Date(entry.clock_in),
        clock_out: entry.clock_out ? new Date(entry.clock_out) : undefined,
        duration_minutes: entry.duration_minutes,
        notes: entry.notes,
        created_at: new Date(entry.created_at),
        organizationId: entry.organization_id
      }));

      setTimeEntries(entries);
      
      // Find current active entry
      const activeEntry = entries.find(entry => !entry.clock_out);
      if (activeEntry) {
        setCurrentEntry({
          isClocked: true,
          clock_in: activeEntry.clock_in,
          id: activeEntry.id
        });
        console.log('Active session found:', activeEntry.id);
      } else {
        setCurrentEntry({ isClocked: false });
        console.log('No active session found');
      }

      console.log(`Successfully loaded ${entries.length} time entries`);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load time entries';
      setLastError(errorMessage);
      
      // Reset current entry state on error to prevent stuck state
      setCurrentEntry({ isClocked: false });
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
      setConnecting(false);
    }
  }, [user?.id, user?.organizationId, createRequestKey, setConnecting]);

  // Enhanced clock in with better validation
  const clockIn = async (notes?: string) => {
    if (!user?.organizationId) {
      toast.error('Organization not found');
      return;
    }

    if (!isOnline) {
      toast.error('Cannot clock in while offline. Please check your connection.');
      return;
    }

    if (currentEntry.isClocked) {
      toast.error('You are already clocked in');
      return;
    }

    try {
      setIsLoading(true);
      setLastError(null);

      console.log('Attempting to clock in...');
      
      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          user_id: user.id,
          organization_id: user.organizationId,
          notes: notes || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Clock in error:', error);
        throw error;
      }

      console.log('Clock in successful:', data);

      const newEntry: TimeEntry = {
        id: data.id,
        user_id: data.user_id,
        clock_in: new Date(data.clock_in),
        duration_minutes: data.duration_minutes,
        notes: data.notes,
        created_at: new Date(data.created_at),
        organizationId: data.organization_id
      };

      // Optimistic update
      setCurrentEntry({
        isClocked: true,
        clock_in: newEntry.clock_in,
        id: newEntry.id
      });
      setTimeEntries(prev => [newEntry, ...prev]);
      
      // Clear cache to force refresh
      requestManager.clearCache(createRequestKey('fetch-entries'));
      
      toast.success('Clocked in successfully');
      
      // Refresh data after a short delay
      setTimeout(() => fetchTimeEntries(false), 1000);
    } catch (error) {
      console.error('Error clocking in:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clock in';
      setLastError(errorMessage);
      toast.error('Failed to clock in. Please try again.');
      setCurrentEntry({ isClocked: false });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced clock out with better error handling and validation
  const clockOut = async (notes?: string) => {
    if (!currentEntry?.id) {
      toast.error('No active session found');
      console.warn('Clock out attempted but no active session ID');
      await fetchTimeEntries(false); // Refresh to sync state
      return;
    }

    if (!isOnline) {
      toast.error('Cannot clock out while offline. Changes will sync when connection is restored.');
      return;
    }

    const clockOutTime = new Date();
    const sessionId = currentEntry.id;
    
    try {
      setIsLoading(true);
      setLastError(null);
      
      console.log('Attempting to clock out session:', sessionId);
      
      // Verify the session exists and is still active
      const { data: checkData, error: checkError } = await supabase
        .from('time_entries')
        .select('id, clock_out')
        .eq('id', sessionId)
        .single();

      if (checkError) {
        console.error('Session verification failed:', checkError);
        throw new Error('Session not found or already ended');
      }

      if (checkData.clock_out) {
        console.warn('Session already clocked out');
        setCurrentEntry({ isClocked: false });
        toast.warning('Session was already ended');
        await fetchTimeEntries(false);
        return;
      }

      // Proceed with clock out
      const { error } = await supabase
        .from('time_entries')
        .update({ 
          clock_out: clockOutTime.toISOString(),
          notes: notes || null 
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Clock out update failed:', error);
        throw error;
      }

      console.log('Clock out successful for session:', sessionId);

      // Optimistic update
      setCurrentEntry({ isClocked: false });
      
      // Clear cache to force refresh
      requestManager.clearCache(createRequestKey('fetch-entries'));
      
      toast.success('Clocked out successfully');
      
      // Refresh data after a short delay
      setTimeout(() => fetchTimeEntries(false), 1000);
    } catch (error) {
      console.error('Error in clockOut:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clock out';
      setLastError(errorMessage);
      toast.error(`Failed to clock out: ${errorMessage}`);
      
      // Don't revert optimistic update on error - let user retry
      // But refresh to get current state
      setTimeout(() => fetchTimeEntries(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced break handling
  const startBreak = async (breakType: string, notes?: string) => {
    if (!currentEntry?.id) {
      toast.error('No active session to take a break from');
      return;
    }

    try {
      const breakNotes = `${breakType} break${notes ? `: ${notes}` : ''}`;
      await clockOut(breakNotes);
      toast.success(`${breakType} break started`);
    } catch (error) {
      console.error('Error starting break:', error);
      toast.error('Failed to start break');
    }
  };

  // Keep existing weekly entries function
  const getWeeklyTimeEntries = async (weekStart?: Date) => {
    if (!user) return [];
    
    const requestKey = createRequestKey('weekly-entries', { 
      weekStart: weekStart?.toISOString() 
    });
    
    try {
      return await requestManager.dedupe(requestKey, async () => {
        let start: Date;
        if (weekStart) {
          start = startOfWeek(weekStart, { weekStartsOn: 1 });
        } else {
          start = startOfWeek(new Date(), { weekStartsOn: 1 });
        }
        const end = addDays(start, 7);

        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('clock_in', start.toISOString())
          .lt('clock_in', end.toISOString())
          .order('clock_in', { ascending: true });

        if (error) throw error;
        return data || [];
      });
    } catch (error) {
      console.error('Error in getWeeklyTimeEntries:', error);
      return [];
    }
  };

  // Keep existing team member entries function
  const getTeamMemberTimeEntries = async (teamMemberId: string, weekStart: Date) => {
    if (!user) return [];
    
    const requestKey = createRequestKey('team-entries', { 
      teamMemberId, 
      weekStart: weekStart.toISOString() 
    });
    
    try {
      return await requestManager.dedupe(requestKey, async () => {
        const start = startOfWeek(weekStart, { weekStartsOn: 1 });
        const end = addDays(start, 7);

        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', teamMemberId)
          .gte('clock_in', start.toISOString())
          .lt('clock_in', end.toISOString())
          .order('clock_in', { ascending: true });

        if (error) throw error;
        return data || [];
      });
    } catch (error) {
      console.error(`Error fetching time entries for team member ${teamMemberId}:`, error);
      return [];
    }
  };

  // Optimized real-time subscription
  useEffect(() => {
    if (!user?.organizationId) return;

    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

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
        (payload) => {
          console.log('Real-time time entry update:', payload);
          
          // Clear cache and refresh after a short debounce
          requestManager.clearCache(createRequestKey('fetch-entries'));
          setTimeout(() => {
            if (!fetchingRef.current) {
              fetchTimeEntries(false);
            }
          }, 500);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, user?.organizationId, fetchTimeEntries, createRequestKey]);

  // Initialize data on mount
  useEffect(() => {
    if (user?.organizationId) {
      fetchTimeEntries();
    }
  }, [user?.organizationId, fetchTimeEntries]);

  // Cleanup cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      requestManager.cleanupExpiredCache();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  // Force refresh function for manual retry
  const forceRefresh = useCallback(() => {
    setLastError(null);
    requestManager.clearCache(createRequestKey('fetch-entries'));
    fetchTimeEntries();
  }, [createRequestKey, fetchTimeEntries]);

  return {
    timeEntries,
    currentEntry,
    isLoading,
    lastError,
    isOnline,
    clockIn,
    clockOut,
    startBreak,
    getWeeklyTimeEntries,
    getTeamMemberTimeEntries,
    fetchTimeEntries,
    forceRefresh
  };
}
