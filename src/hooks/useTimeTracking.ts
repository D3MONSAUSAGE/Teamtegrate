
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

  // Simple active session check without debounce
  const checkActiveSession = useCallback(async (): Promise<boolean> => {
    if (!user?.organizationId) return false;

    const requestKey = createRequestKey('check-active');

    try {
      const result = await requestManager.dedupe(requestKey, async () => {
        const { data, error } = await supabase
          .from('time_entries')
          .select('id, clock_in, created_at')
          .eq('user_id', user.id)
          .eq('organization_id', user.organizationId)
          .is('clock_out', null)
          .limit(1);

        if (error) throw error;
        return data || [];
      });

      return result.length > 0;
    } catch (error) {
      console.error('Error checking active session:', error);
      return false;
    }
  }, [user?.id, user?.organizationId, createRequestKey]);

  // Enhanced fetch with deduplication and error handling
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
      
      // Find current active entry with better validation
      const activeEntry = entries.find(entry => !entry.clock_out);
      if (activeEntry) {
        setCurrentEntry({
          isClocked: true,
          clock_in: activeEntry.clock_in,
          id: activeEntry.id
        });
      } else {
        setCurrentEntry({ isClocked: false });
      }

      console.log(`Successfully loaded ${entries.length} time entries`);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      
      // Use cached data if available
      const cachedData = requestManager.getCachedData<any[]>(requestKey);
      if (cachedData && cachedData.length > 0) {
        console.log('Using cached time entries data');
        toast.warning('Using cached data due to connection issues');
      } else {
        toast.error('Failed to load time entries. Please check your connection.');
      }
      
      // Reset current entry state on error to prevent stuck state
      setCurrentEntry({ isClocked: false });
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
      setConnecting(false);
    }
  }, [user?.id, user?.organizationId, createRequestKey, setConnecting]);

  // Enhanced clock in with simplified validation
  const clockIn = async (notes?: string) => {
    if (!user?.organizationId) {
      toast.error('Organization not found');
      return;
    }

    if (!isOnline) {
      toast.error('Cannot clock in while offline. Please check your connection.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Simple check for active session - don't block if check fails
      try {
        const hasActive = await checkActiveSession();
        if (hasActive) {
          toast.error('You already have an active time tracking session. Please clock out first.');
          await fetchTimeEntries(false);
          return;
        }
      } catch (checkError) {
        console.warn('Active session check failed, proceeding with clock in:', checkError);
      }

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
      toast.error('Failed to clock in. Please try again.');
      setCurrentEntry({ isClocked: false });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced clock out with better error handling
  const clockOut = async (notes?: string) => {
    if (!currentEntry?.id) {
      toast.error('No active clock-in found');
      await fetchTimeEntries(false);
      return;
    }

    if (!isOnline) {
      toast.error('Cannot clock out while offline. Changes will sync when connection is restored.');
      return;
    }

    const clockOutTime = new Date();
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('time_entries')
        .update({ 
          clock_out: clockOutTime.toISOString(),
          notes: notes || null 
        })
        .eq('id', currentEntry.id);

      if (error) throw error;

      // Optimistic update
      setCurrentEntry({ isClocked: false });
      
      // Clear cache to force refresh
      requestManager.clearCache(createRequestKey('fetch-entries'));
      
      toast.success('Clocked out successfully');
      
      // Refresh data after a short delay
      setTimeout(() => fetchTimeEntries(false), 1000);
    } catch (error) {
      console.error('Error in clockOut:', error);
      toast.error('Failed to clock out. Please try again.');
      
      // Revert optimistic update on error
      setCurrentEntry({
        isClocked: true,
        clock_in: currentEntry.clock_in,
        id: currentEntry.id
      });
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

  // Enhanced weekly entries fetch
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

  // Enhanced team member entries fetch
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
      requestManager.clearExpiredCache();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  // Force refresh function for manual retry
  const forceRefresh = useCallback(() => {
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
