
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, addDays } from 'date-fns';
import { TimeEntry } from '@/types';

// Accept an optional "weekStart" param to fetch entries for a specific week.
export function useTimeTracking() {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
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
      
      // Find current active entry
      const activeEntry = entries.find(entry => !entry.clock_out);
      setCurrentEntry(activeEntry || null);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Failed to load time entries');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.organizationId]);

  const clockIn = async (notes?: string) => {
    if (!user?.organizationId) return;

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

      setCurrentEntry(newEntry);
      setTimeEntries(prev => [newEntry, ...prev]);
      toast.success('Clocked in successfully');
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error('Failed to clock in');
    }
  };

  const clockOut = async (notes?: string) => {
    if (!currentEntry?.id) {
      toast.error('No active clock-in found');
      return;
    }

    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ 
          clock_out: new Date().toISOString(),
          notes: notes || null 
        })
        .eq('id', currentEntry.id);

      if (error) {
        toast.error('Failed to clock out', { description: error.message });
        return;
      }

      setCurrentEntry(null);
      toast.success('Clocked out successfully');
    } catch (error) {
      console.error('Error in clockOut:', error);
      toast.error('An unexpected error occurred');
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
      // End: start + 7 days, i.e. next week's Monday
      const end = addDays(start, 7);

      // RLS policies will automatically filter by organization
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

      // RLS policies will ensure only same-organization data is returned
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

  return {
    timeEntries,
    currentEntry,
    clockIn,
    clockOut,
    getWeeklyTimeEntries,
    getTeamMemberTimeEntries
  };
};
