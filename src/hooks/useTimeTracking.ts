
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, addDays } from 'date-fns';

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
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<CurrentEntryState>({ isClocked: false });
  const [isLoading, setIsLoading] = useState(false);

  const fetchTimeEntries = useCallback(async () => {
    if (!user?.organizationId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const entries: TimeEntry[] = (data || []).map(entry => ({
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
      
      // Find current active entry - enhanced validation
      const activeEntry = entries.find(entry => !entry.clock_out);
      if (activeEntry) {
        console.log('Found active entry:', activeEntry);
        setCurrentEntry({
          isClocked: true,
          clock_in: activeEntry.clock_in,
          id: activeEntry.id
        });
      } else {
        setCurrentEntry({ isClocked: false });
      }
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Failed to load time entries');
      // Reset current entry state on error to prevent stuck state
      setCurrentEntry({ isClocked: false });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.organizationId]);

  // Enhanced active session check with better error handling
  const checkActiveSession = async (): Promise<boolean> => {
    if (!user?.organizationId) return false;

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('id, clock_in, created_at')
        .eq('user_id', user.id)
        .eq('organization_id', user.organizationId)
        .is('clock_out', null)
        .limit(1);

      if (error) {
        console.error('Error checking active session:', error);
        return false;
      }

      const hasActive = (data || []).length > 0;
      if (hasActive) {
        console.log('Active session found:', data[0]);
      }
      return hasActive;
    } catch (error) {
      console.error('Error checking active session:', error);
      return false;
    }
  };

  const clockIn = async (notes?: string) => {
    if (!user?.organizationId) {
      toast.error('Organization not found');
      return;
    }

    // Enhanced active session check
    const hasActiveSession = await checkActiveSession();
    if (hasActiveSession) {
      toast.error('You already have an active time tracking session. Please clock out first.');
      // Refresh entries to sync state
      await fetchTimeEntries();
      return;
    }

    try {
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
      
      toast.success('Clocked in successfully');
      
      // Refresh data to ensure consistency
      await fetchTimeEntries();
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error('Failed to clock in');
      // Revert optimistic update on error
      setCurrentEntry({ isClocked: false });
    }
  };

  const clockOut = async (notes?: string) => {
    if (!currentEntry?.id) {
      toast.error('No active clock-in found');
      // Try to refresh and find active session
      await fetchTimeEntries();
      return;
    }

    const clockOutTime = new Date();
    
    try {
      // Optimistic update
      setCurrentEntry({ isClocked: false });
      
      const { error } = await supabase
        .from('time_entries')
        .update({ 
          clock_out: clockOutTime.toISOString(),
          notes: notes || null 
        })
        .eq('id', currentEntry.id);

      if (error) {
        toast.error('Failed to clock out', { description: error.message });
        // Revert optimistic update on error
        setCurrentEntry({
          isClocked: true,
          clock_in: currentEntry.clock_in,
          id: currentEntry.id
        });
        return;
      }

      toast.success('Clocked out successfully');
      
      // Refresh data immediately to show updated duration
      await fetchTimeEntries();
    } catch (error) {
      console.error('Error in clockOut:', error);
      toast.error('An unexpected error occurred');
      // Revert optimistic update on error
      setCurrentEntry({
        isClocked: true,
        clock_in: currentEntry.clock_in,
        id: currentEntry.id
      });
    }
  };

  // Enhanced break handling
  const startBreak = async (breakType: string, notes?: string) => {
    if (!currentEntry?.id) {
      toast.error('No active session to take a break from');
      return;
    }

    try {
      // Clock out current session with break notation
      const breakNotes = `${breakType} break${notes ? `: ${notes}` : ''}`;
      await clockOut(breakNotes);
      
      toast.success(`${breakType} break started`);
    } catch (error) {
      console.error('Error starting break:', error);
      toast.error('Failed to start break');
    }
  };

  // Accepts an optional weekStart: Date to fetch entries in ANY specific week
  const getWeeklyTimeEntries = async (weekStart?: Date) => {
    if (!user) return [];
    
    try {
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

      if (error) {
        console.error('Error fetching weekly time entries:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getWeeklyTimeEntries:', error);
      return [];
    }
  };

  // New function to fetch time entries for a specific team member
  const getTeamMemberTimeEntries = async (teamMemberId: string, weekStart: Date) => {
    if (!user) return [];
    
    try {
      const start = startOfWeek(weekStart, { weekStartsOn: 1 });
      const end = addDays(start, 7);

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', teamMemberId)
        .gte('clock_in', start.toISOString())
        .lt('clock_in', end.toISOString())
        .order('clock_in', { ascending: true });

      if (error) {
        console.error(`Error fetching time entries for team member ${teamMemberId}:`, error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTeamMemberTimeEntries:', error);
      return [];
    }
  };

  // Setup real-time subscription with enhanced error handling
  useEffect(() => {
    if (!user?.organizationId) return;

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
          // Refresh data when changes occur
          fetchTimeEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.organizationId, fetchTimeEntries]);

  // Initialize data on mount
  useEffect(() => {
    if (user?.organizationId) {
      fetchTimeEntries();
    }
  }, [user?.organizationId, fetchTimeEntries]);

  return {
    timeEntries,
    currentEntry,
    isLoading,
    clockIn,
    clockOut,
    startBreak,
    getWeeklyTimeEntries,
    getTeamMemberTimeEntries,
    fetchTimeEntries
  };
}
