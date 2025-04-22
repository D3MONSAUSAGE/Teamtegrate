
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, addDays, format, endOfWeek } from 'date-fns';

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

  const fetchTimeEntriesForWeek = async (weekDate: Date) => {
    if (!user) return [];
    
    // Use startOfWeek with weekStartsOn: 1 (Monday) for consistency
    const start = startOfWeek(weekDate, { weekStartsOn: 1 });
    // Use endOfWeek instead of manually adding days
    const end = endOfWeek(start, { weekStartsOn: 1 });
    
    console.log(`Fetching entries from ${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`);

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('clock_in', start.toISOString())
      .lt('clock_in', end.toISOString())
      .order('clock_in', { ascending: true });

    if (error) {
      console.error('Error fetching time entries for week:', error);
      toast.error('Failed to fetch time entries');
      return [];
    }

    console.log(`Fetched ${data?.length || 0} entries for week of ${format(start, 'yyyy-MM-dd')}`);
    return data || [];
  };

  const getWeeklyTimeEntries = async (weekStart?: Date) => {
    return fetchTimeEntriesForWeek(weekStart || new Date());
  };

  const getTeamMemberTimeEntries = async (teamMemberId: string, weekStart: Date) => {
    if (!user) return [];
    
    const start = startOfWeek(weekStart, { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });

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
  };

  return {
    currentEntry,
    clockIn,
    clockOut,
    getWeeklyTimeEntries,
    getTeamMemberTimeEntries,
    fetchTimeEntriesForWeek
  };
};
