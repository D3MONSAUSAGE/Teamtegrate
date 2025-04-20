
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

  const getWeeklyTimeEntries = async () => {
    if (!user) return [];

    // Set start of week to 7 days ago to ensure we capture a full week of data
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('clock_in', startOfWeek.toISOString())
      .order('clock_in', { ascending: true });

    if (error) {
      console.error('Error fetching weekly time entries:', error);
      return [];
    }

    return data || [];
  };

  return {
    currentEntry,
    clockIn,
    clockOut,
    getWeeklyTimeEntries
  };
};
