import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';

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

  const taskStatsQuery = useQuery({
    queryKey: ['employee-task-stats', userId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_employee_task_stats', {
        target_user_id: userId,
        start_date: startDate,
        end_date: endDate,
      });
      if (error) throw error;
      return data as any | null;
    },
    enabled: !!userId && !!startDate && !!endDate,
  });

  const hoursStatsQuery = useQuery({
    queryKey: ['employee-hours-stats', userId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_employee_hours_stats', {
        target_user_id: userId,
        start_date: startDate,
        end_date: endDate,
      });
      if (error) throw error;
      return data as any | null;
    },
    enabled: !!userId && !!startDate && !!endDate,
  });

  const contributionsQuery = useQuery({
    queryKey: ['employee-project-contrib', userId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_employee_project_contributions', {
        target_user_id: userId,
        start_date: startDate,
        end_date: endDate,
      });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!userId && !!startDate && !!endDate,
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
