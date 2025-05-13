
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
}

export const useTimeEntries = () => {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeEntries = useCallback(async () => {
    if (!user) {
      setTimeEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching time entries for user:', user.id);
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .order('clock_in', { ascending: false });

      if (error) {
        console.error('Error fetching time entries:', error);
        setError('Failed to load time entries');
        toast.error('Failed to load time entries');
        return;
      }

      console.log(`Retrieved ${data.length} time entries`);
      setTimeEntries(data as TimeEntry[]);
    } catch (err) {
      console.error('Unexpected error in fetchTimeEntries:', err);
      setError('An unexpected error occurred');
      toast.error('Failed to load time entries');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTimeEntries();
  }, [fetchTimeEntries]);

  const refresh = useCallback(() => {
    return fetchTimeEntries();
  }, [fetchTimeEntries]);

  return {
    timeEntries,
    isLoading,
    error,
    refresh
  };
};
