
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, addDays } from 'date-fns';

// Accept an optional "weekStart" param to fetch entries for a specific week.
export const useTimeTracking = () => {
  const { user } = useAuth();
  const [currentEntry, setCurrentEntry] = useState<{
    id?: string;
    clock_in?: Date;
    isClocked: boolean;
  }>({ isClocked: false });

  useEffect(() => {
    if (!user) return;
    const fetchCurrentEntry = async () => {
      try {
        const { data, error } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .is('clock_out', null)
          .maybeSingle();

        if (error) {
          console.error('Error fetching current time entry:', error);
          return;
        }

        if (data) {
          setCurrentEntry({ 
            id: data.id, 
            clock_in: new Date(data.clock_in), 
            isClocked: true 
          });
        }
      } catch (error) {
        console.error('Error in fetchCurrentEntry:', error);
      }
    };

    fetchCurrentEntry();
  }, [user]);

  const clockIn = async (notes?: string) => {
    if (!user) {
      toast.error('You must be logged in to clock in');
      return;
    }

    if (currentEntry.isClocked) {
      toast.error('You are already clocked in');
      return;
    }

    try {
      // Include organization_id for multi-tenancy
      const { data, error } = await supabase
        .from('time_entries')
        .insert({ 
          user_id: user.id, 
          notes: notes || null
          // organization_id will be handled by RLS policies based on user's org
        })
        .select()
        .single();

      if (error) {
        toast.error('Failed to clock in', { description: error.message });
        return;
      }

      setCurrentEntry({ 
        id: data.id, 
        clock_in: new Date(data.clock_in), 
        isClocked: true 
      });
      toast.success('Clocked in successfully');
    } catch (error) {
      console.error('Error in clockIn:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const clockOut = async (notes?: string) => {
    if (!currentEntry.id) {
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

      setCurrentEntry({ isClocked: false });
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
    currentEntry,
    clockIn,
    clockOut,
    getWeeklyTimeEntries,
    getTeamMemberTimeEntries
  };
};
