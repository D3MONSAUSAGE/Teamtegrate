import { useState, useEffect } from 'react';
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

export const useEmployeeWeeklySchedule = (weekDate: Date = new Date()): WeeklyScheduleData => {
  const { user } = useAuth();
  const [scheduledHours, setScheduledHours] = useState(0);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

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
          // Calculate duration in hours from start and end times
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
  }, [user?.id, weekDate]);

  return {
    scheduledHours,
    scheduleEntries,
    isLoading,
    error
  };
};