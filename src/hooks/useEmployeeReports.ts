import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { validateUUID } from '@/utils/uuidValidation';

export type EmployeeReportsParams = {
  userId: string;
  timeRange: string;
  dateRange?: DateRange;
};

function computeRange(timeRange: string, dateRange?: DateRange) {
  const end = new Date();
  let start = new Date();

  if (timeRange !== 'custom') {
    const days = timeRange === '7 days' ? 7 : timeRange === '30 days' ? 30 : 90;
    start.setDate(end.getDate() - days + 1);
  } else if (dateRange?.from && dateRange?.to) {
    start = dateRange.from;
    // include the end day
    end.setTime(dateRange.to.getTime());
  } else {
    start.setDate(end.getDate() - 30);
  }

  // format YYYY-MM-DD for SQL date params
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

export const useEmployeeReports = ({ userId, timeRange, dateRange }: EmployeeReportsParams) => {
  const { startDate, endDate } = useMemo(() => computeRange(timeRange, dateRange), [timeRange, dateRange]);
  
  // Validate that userId is a proper UUID format
  const validUserId = validateUUID(userId);
  const isValidRequest = Boolean(validUserId && startDate && endDate);

  const taskStatsQuery = useQuery({
    queryKey: ['employee-task-stats', validUserId, startDate, endDate],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_employee_task_stats', {
          target_user_id: validUserId!,
          start_date: startDate,
          end_date: endDate,
        });
        if (error) throw error;
        return data as any | null;
      } catch (error) {
        console.error('Failed to fetch task stats:', error);
        throw error;
      }
    },
    enabled: isValidRequest,
  });

  const hoursStatsQuery = useQuery({
    queryKey: ['employee-hours-stats', validUserId, startDate, endDate],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_employee_hours_stats', {
          target_user_id: validUserId!,
          start_date: startDate,
          end_date: endDate,
        });
        if (error) throw error;
        return data as any | null;
      } catch (error) {
        console.error('Failed to fetch hours stats:', error);
        throw error;
      }
    },
    enabled: isValidRequest,
  });

  const contributionsQuery = useQuery({
    queryKey: ['employee-project-contrib', validUserId, startDate, endDate],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_employee_project_contributions', {
          target_user_id: validUserId!,
          start_date: startDate,
          end_date: endDate,
        });
        if (error) throw error;
        return (data as any[]) || [];
      } catch (error) {
        console.error('Failed to fetch project contributions:', error);
        throw error;
      }
    },
    enabled: isValidRequest,
  });

  const isLoading = taskStatsQuery.isLoading || hoursStatsQuery.isLoading || contributionsQuery.isLoading;
  const error = taskStatsQuery.error || hoursStatsQuery.error || contributionsQuery.error;

  return {
    taskStats: taskStatsQuery.data,
    hoursStats: hoursStatsQuery.data,
    contributions: contributionsQuery.data,
    isLoading,
    error,
    range: { startDate, endDate },
  };
};
