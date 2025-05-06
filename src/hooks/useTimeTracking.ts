
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

interface TimeEntry {
  id?: string;
  user_id?: string;
  clock_in?: string | null;
  clock_out?: string | null;
  notes?: string | null;
  isClocked?: boolean;
}

export const useTimeTracking = () => {
  const { user } = useAuth();
  const [currentEntry, setCurrentEntry] = useState<TimeEntry>({
    isClocked: false
  });
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  // Check if user is currently clocked in
  const checkCurrentStatus = useCallback(async () => {
    if (!user) return;
    
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
        setCurrentEntry({
          ...data[0],
          isClocked: true
        });
      } else {
        setCurrentEntry({ isClocked: false });
      }
    } catch (error) {
      console.error('Error checking clock status:', error);
    }
  }, [user]);

  // Load user status on component mount
  useEffect(() => {
    checkCurrentStatus();
  }, [user, checkCurrentStatus]);

  // Clock in function
  const clockIn = useCallback(async (notes?: string) => {
    if (!user) {
      toast.error('Please log in to track time');
      playErrorSound();
      return;
    }
    
    if (currentEntry.isClocked) {
      toast.error('You are already clocked in');
      return;
    }
    
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('time_entries')
        .insert([
          {
            user_id: user.id,
            clock_in: now,
            notes: notes || null
          }
        ])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentEntry({
          ...data[0],
          isClocked: true
        });
        toast.success('Clocked in successfully');
        playSuccessSound();
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      toast.error('Failed to clock in');
      playErrorSound();
    }
  }, [user, currentEntry.isClocked]);

  // Clock out function
  const clockOut = useCallback(async (notes?: string) => {
    if (!user || !currentEntry.id) {
      toast.error('No active time entry found');
      playErrorSound();
      return;
    }
    
    try {
      const now = new Date().toISOString();
      
      // Calculate duration in minutes
      const clockInTime = new Date(currentEntry.clock_in || '').getTime();
      const clockOutTime = new Date(now).getTime();
      const durationMinutes = Math.round((clockOutTime - clockInTime) / (1000 * 60));
      
      const { error } = await supabase
        .from('time_entries')
        .update({
          clock_out: now,
          duration_minutes: durationMinutes,
          notes: notes || currentEntry.notes
        })
        .eq('id', currentEntry.id);
      
      if (error) throw error;
      
      setCurrentEntry({ isClocked: false });
      toast.success('Clocked out successfully');
      playSuccessSound();
      
      // Refresh entries
      await fetchTimeEntries();
    } catch (error) {
      console.error('Error clocking out:', error);
      toast.error('Failed to clock out');
      playErrorSound();
    }
  }, [user, currentEntry]);

  // Fetch time entries for today
  const fetchTimeEntries = useCallback(async () => {
    if (!user) return [];
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('clock_in', today.toISOString())
        .order('clock_in', { ascending: false });
      
      if (error) throw error;
      
      setTimeEntries(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching time entries:', error);
      return [];
    }
  }, [user]);

  // Fetch time entries for a specific week
  const getWeeklyTimeEntries = useCallback(async (weekStart: Date) => {
    if (!user) return [];
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    try {
      console.log(`Fetching time entries for user: ${user.id}`);
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('clock_in', weekStart.toISOString())
        .lt('clock_in', weekEnd.toISOString())
        .order('clock_in', { ascending: true });
      
      if (error) throw error;
      
      console.log(`Retrieved ${data?.length || 0} time entries`);
      return data || [];
    } catch (error) {
      console.error('Error fetching time entries:', error);
      return [];
    }
  }, [user]);

  useEffect(() => {
    fetchTimeEntries();
  }, [fetchTimeEntries]);

  return {
    currentEntry,
    timeEntries,
    clockIn,
    clockOut,
    fetchTimeEntries,
    getWeeklyTimeEntries,
    checkCurrentStatus
  };
};
