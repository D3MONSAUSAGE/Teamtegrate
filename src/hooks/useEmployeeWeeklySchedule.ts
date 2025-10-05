import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, format, differenceInHours, parseISO } from 'date-fns';

interface ScheduleEntry {
  id: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  shift_name: string;
  duration_hours: number;
}

interface WeeklyScheduleData {
  scheduledHours: number;
  scheduleEntries: ScheduleEntry[];
  isLoading: boolean;
  error: string | null;
}

// Request cache to prevent duplicate calls
const requestCache = new Map<string, { data: WeeklyScheduleData; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export const useEmployeeWeeklySchedule = (weekDate: Date = new Date()): WeeklyScheduleData => {
  const { user } = useAuth();
  const [scheduledHours, setScheduledHours] = useState(0);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user?.id) return;

    const cacheKey = `${user.id}-${format(weekDate, 'yyyy-MM-dd')}`;
    const now = Date.now();
    
    // Check cache first
    const cached = requestCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setScheduledHours(cached.data.scheduledHours);
      setScheduleEntries(cached.data.scheduleEntries);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Throttle requests - minimum 5 seconds between fetches
    const timeSinceLastFetch = now - lastFetchRef.current;
    if (timeSinceLastFetch < 5000) {
      // Clear any pending timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Schedule fetch for later
      fetchTimeoutRef.current = setTimeout(() => {
        lastFetchRef.current = Date.now();
        fetchWeeklySchedule();
      }, 5000 - timeSinceLastFetch);
      
      return;
    }

    lastFetchRef.current = now;

    const fetchWeeklySchedule = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

        const { data, error } = await supabase
          .from('employee_schedules')
          .select('*')
          .eq('employee_id', user.id)
          .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
          .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'));

        if (error) throw error;

        const entries = (data || []).map(entry => {
          const startTime = parseISO(entry.scheduled_start_time);
          const endTime = parseISO(entry.scheduled_end_time);
          const duration = differenceInHours(endTime, startTime);
          
          return {
            id: entry.id,
            scheduled_date: entry.scheduled_date,
            scheduled_start_time: entry.scheduled_start_time,
            scheduled_end_time: entry.scheduled_end_time,
            shift_name: 'Scheduled Shift',
            duration_hours: duration
          };
        });

        const totalHours = entries.reduce((total, entry) => total + entry.duration_hours, 0);

        setScheduleEntries(entries);
        setScheduledHours(totalHours);
        
        // Cache the result
        requestCache.set(cacheKey, {
          data: { scheduledHours: totalHours, scheduleEntries: entries, isLoading: false, error: null },
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('Error fetching weekly schedule:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
        setScheduledHours(0);
        setScheduleEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklySchedule();

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [user?.id, weekDate]);

  return {
    scheduledHours,
    scheduleEntries,
    isLoading,
    error
  };
};