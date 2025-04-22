
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, addDays, subWeeks, endOfWeek, parseISO, format, subDays } from 'date-fns';

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
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .single();

      if (data) {
        setCurrentEntry({ 
          id: data.id, 
          clock_in: new Date(data.clock_in), 
          isClocked: true 
        });
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

    const { data, error } = await supabase
      .from('time_entries')
      .insert({ 
        user_id: user.id, 
        notes: notes || null 
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
  };

  const clockOut = async (notes?: string) => {
    if (!currentEntry.id) {
      toast.error('No active clock-in found');
      return;
    }

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
  };

  const getWeeklyTimeEntries = async (weekStart?: Date) => {
    if (!user) return [];
    let start: Date;
    if (weekStart) {
      start = startOfWeek(weekStart, { weekStartsOn: 1 });
    } else {
      start = startOfWeek(new Date(), { weekStartsOn: 1 });
    }
    const end = endOfWeek(start, { weekStartsOn: 1 });

    // Add 1 day to end date to ensure we get all entries from the last day
    const endPlusBuffer = new Date(end);
    endPlusBuffer.setDate(end.getDate() + 1);

    console.log(`Fetching entries from ${format(start, 'yyyy-MM-dd HH:mm:ss')} to ${format(endPlusBuffer, 'yyyy-MM-dd HH:mm:ss')}`);

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('clock_in', start.toISOString())
      .lt('clock_in', endPlusBuffer.toISOString())
      .order('clock_in', { ascending: true });

    if (error) {
      console.error('Error fetching weekly time entries:', error);
      toast.error('Failed to fetch time entries');
      return [];
    }

    console.log(`Retrieved ${data?.length || 0} time entries for week of ${format(start, 'yyyy-MM-dd')}`);
    if (data && data.length > 0) {
      data.forEach(entry => {
        console.log(`Entry ${entry.id}: ${format(new Date(entry.clock_in), 'yyyy-MM-dd HH:mm:ss')} - ${entry.clock_out ? format(new Date(entry.clock_out), 'yyyy-MM-dd HH:mm:ss') : 'ongoing'}, Notes: ${entry.notes || 'none'}`);
      });
    }

    return data || [];
  };

  const getTeamMemberTimeEntries = async (teamMemberId: string, weekStart: Date) => {
    if (!user) return [];
    
    const start = startOfWeek(weekStart, { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });
    
    // Add 1 day to end date to ensure we get all entries from the last day
    const endPlusBuffer = new Date(end);
    endPlusBuffer.setDate(end.getDate() + 1);

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', teamMemberId)
      .gte('clock_in', start.toISOString())
      .lt('clock_in', endPlusBuffer.toISOString())
      .order('clock_in', { ascending: true });

    if (error) {
      console.error(`Error fetching time entries for team member ${teamMemberId}:`, error);
      return [];
    }

    return data || [];
  };

  const fetchTimeEntriesForWeek = async (weekStart: Date) => {
    if (!user) return [];
    
    // Use startOfWeek to get the beginning of the week (Monday)
    const start = startOfWeek(weekStart, { weekStartsOn: 1 });
    
    // Use endOfWeek to get the end of the week (Sunday, end of day)
    // Then add 1 day to make sure we include entries from the last day
    const end = endOfWeek(start, { weekStartsOn: 1 });
    const endPlusBuffer = new Date(end);
    endPlusBuffer.setDate(end.getDate() + 1);
    
    console.log(`Fetching time entries from ${format(start, 'yyyy-MM-dd HH:mm:ss')} to ${format(endPlusBuffer, 'yyyy-MM-dd HH:mm:ss')}`);
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('clock_in', start.toISOString())
        .lt('clock_in', endPlusBuffer.toISOString()) // Use lt instead of lte to include the whole day
        .order('clock_in', { ascending: true });

      if (error) {
        console.error('Error fetching time entries for week:', error);
        toast.error('Failed to fetch time entries');
        return [];
      }

      console.log(`Found ${data?.length || 0} time entries for the week of ${format(start, 'yyyy-MM-dd')}`);
      
      // Log each entry for debugging
      if (data) {
        data.forEach(entry => {
          console.log(`Entry ${entry.id}: ${format(new Date(entry.clock_in), 'yyyy-MM-dd HH:mm:ss')} - ${entry.clock_out ? format(new Date(entry.clock_out), 'yyyy-MM-dd HH:mm:ss') : 'ongoing'}, Notes: ${entry.notes || 'none'}`);
        });
      }
      
      return data || [];
    } catch (e) {
      console.error('Exception while fetching time entries:', e);
      toast.error('Failed to fetch time entries due to an exception');
      return [];
    }
  };

  // Add a specific function to fetch previous week's entries
  const fetchPreviousWeekTimeEntries = async () => {
    if (!user) return [];
    
    // Get start of current week
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    // Get start of previous week (7 days before current week start)
    const previousWeekStart = subWeeks(currentWeekStart, 1);
    
    // Get end of previous week
    const previousWeekEnd = subDays(currentWeekStart, 1);
    
    console.log(`Fetching previous week time entries from ${format(previousWeekStart, 'yyyy-MM-dd HH:mm:ss')} to ${format(previousWeekEnd, 'yyyy-MM-dd HH:mm:ss')}`);
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('clock_in', previousWeekStart.toISOString())
        .lte('clock_in', previousWeekEnd.toISOString())
        .order('clock_in', { ascending: true });

      if (error) {
        console.error('Error fetching previous week time entries:', error);
        toast.error('Failed to fetch previous week time entries');
        return [];
      }

      console.log(`Found ${data?.length || 0} time entries for previous week`);
      
      if (data && data.length > 0) {
        console.log("Previous week entries:");
        data.forEach(entry => {
          console.log(`Entry ${entry.id}: ${format(new Date(entry.clock_in), 'yyyy-MM-dd HH:mm:ss')} - ${entry.clock_out ? format(new Date(entry.clock_out), 'yyyy-MM-dd HH:mm:ss') : 'ongoing'}, Notes: ${entry.notes || 'none'}`);
        });
      }
      
      return data || [];
    } catch (e) {
      console.error('Exception while fetching previous week time entries:', e);
      toast.error('Failed to fetch previous week time entries');
      return [];
    }
  };

  return {
    currentEntry,
    clockIn,
    clockOut,
    getWeeklyTimeEntries,
    getTeamMemberTimeEntries,
    fetchTimeEntriesForWeek,
    fetchPreviousWeekTimeEntries
  };
};
