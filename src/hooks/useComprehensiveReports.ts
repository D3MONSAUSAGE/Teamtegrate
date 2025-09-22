import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { validateUUID } from '@/utils/uuidValidation';

export type ReportGranularity = 'daily' | 'weekly';

export interface ComprehensiveReportData {
  period_date: string;
  period_label: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  total_minutes_worked: number;
  sessions_count: number;
  overtime_minutes: number;
  avg_task_time: number;
  projects_data: any[];
  productivity_score: number;
  efficiency_rating: number;
}

export interface DailyCompletionData {
  completion_date: string;
  day_name: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  total_time_minutes: number;
  avg_time_per_task: number;
}

function computeRange(timeRange: string, dateRange?: DateRange) {
  const end = new Date();
  let start = new Date();

  if (timeRange !== 'custom') {
    const days = timeRange === '7 days' ? 7 : timeRange === '30 days' ? 30 : 90;
    start.setDate(end.getDate() - days + 1);
  } else if (dateRange?.from && dateRange?.to) {
    start = dateRange.from;
    end.setTime(dateRange.to.getTime());
  } else {
    start.setDate(end.getDate() - 30);
  }

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

export const useComprehensiveReports = ({
  userId,
  timeRange,
  dateRange,
  granularity = 'daily'
}: {
  userId: string;
  timeRange: string;
  dateRange?: DateRange;
  granularity?: ReportGranularity;
}) => {
  const { startDate, endDate } = computeRange(timeRange, dateRange);
  const validUserId = validateUUID(userId);
  const isValidRequest = Boolean(validUserId && startDate && endDate);

  const comprehensiveQuery = useQuery({
    queryKey: ['comprehensive-reports', validUserId, startDate, endDate, granularity],
    staleTime: 30000, // 30 seconds
    queryFn: async (): Promise<ComprehensiveReportData[]> => {
      if (!validUserId) return [];
      
      const { data, error } = await supabase.rpc('get_comprehensive_employee_report', {
        target_user_id: validUserId,
        start_date: startDate,
        end_date: endDate,
        report_granularity: granularity,
      });
      
      if (error) {
        console.error('Failed to fetch comprehensive report:', error);
        return [];
      }
      
      return (data || []).map((item: any) => ({
        period_date: item.period_date,
        period_label: item.period_label,
        total_tasks: item.total_tasks || 0,
        completed_tasks: item.completed_tasks || 0,
        in_progress_tasks: item.in_progress_tasks || 0,
        overdue_tasks: item.overdue_tasks || 0,
        completion_rate: item.completion_rate || 0,
        total_minutes_worked: item.total_minutes_worked || 0,
        sessions_count: item.sessions_count || 0,
        overtime_minutes: item.overtime_minutes || 0,
        avg_task_time: item.avg_task_time || 0,
        projects_data: item.projects_data || [],
        productivity_score: item.productivity_score || 0,
        efficiency_rating: item.efficiency_rating || 0,
      }));
    },
    enabled: isValidRequest,
  });

  const dailyCompletionQuery = useQuery({
    queryKey: ['daily-completion', validUserId, startDate, endDate],
    staleTime: 30000, // 30 seconds
    queryFn: async (): Promise<DailyCompletionData[]> => {
      if (!validUserId) return [];
      
      const { data, error } = await supabase.rpc('get_employee_daily_task_completion', {
        target_user_id: validUserId,
        start_date: startDate,
        end_date: endDate,
      });
      
      if (error) {
        console.error('Failed to fetch daily completion data:', error);
        return [];
      }
      
      return (data || []).map((item: any) => ({
        completion_date: item.completion_date,
        day_name: item.day_name?.trim() || '',
        total_tasks: item.total_tasks || 0,
        completed_tasks: item.completed_tasks || 0,
        pending_tasks: item.pending_tasks || 0,
        overdue_tasks: item.overdue_tasks || 0,
        completion_rate: item.completion_rate || 0,
        total_time_minutes: item.total_time_minutes || 0,
        avg_time_per_task: item.avg_time_per_task || 0,
      }));
    },
    enabled: isValidRequest,
  });

  const isLoading = comprehensiveQuery.isLoading || dailyCompletionQuery.isLoading;
  const error = comprehensiveQuery.error || dailyCompletionQuery.error;

  // Calculate aggregated summary from comprehensive data
  const summary = React.useMemo(() => {
    const data = comprehensiveQuery.data || [];
    if (!data.length) {
      return {
        total_tasks: 0,
        completed_tasks: 0,
        completion_rate: 0,
        total_hours: 0,
        avg_productivity_score: 0,
        avg_efficiency_rating: 0,
        total_projects: 0,
      };
    }

    const totals = data.reduce(
      (acc, item) => ({
        total_tasks: acc.total_tasks + item.total_tasks,
        completed_tasks: acc.completed_tasks + item.completed_tasks,
        total_minutes: acc.total_minutes + item.total_minutes_worked,
        productivity_sum: acc.productivity_sum + item.productivity_score,
        efficiency_sum: acc.efficiency_sum + item.efficiency_rating,
      }),
      { total_tasks: 0, completed_tasks: 0, total_minutes: 0, productivity_sum: 0, efficiency_sum: 0 }
    );

    // Get unique projects from all periods
    const allProjects = new Set();
    data.forEach(item => {
      item.projects_data.forEach((project: any) => {
        if (project.project_id !== 'no-project') {
          allProjects.add(project.project_id);
        }
      });
    });

    return {
      total_tasks: totals.total_tasks,
      completed_tasks: totals.completed_tasks,
      completion_rate: totals.total_tasks > 0 ? Math.round((totals.completed_tasks / totals.total_tasks) * 100) : 0,
      total_hours: Math.round((totals.total_minutes / 60) * 100) / 100,
      avg_productivity_score: data.length > 0 ? Math.round((totals.productivity_sum / data.length) * 100) / 100 : 0,
      avg_efficiency_rating: data.length > 0 ? Math.round((totals.efficiency_sum / data.length) * 100) / 100 : 0,
      total_projects: allProjects.size,
    };
  }, [comprehensiveQuery.data]);

  return {
    comprehensiveData: comprehensiveQuery.data || [],
    dailyCompletionData: dailyCompletionQuery.data || [],
    summary,
    isLoading,
    error,
    range: { startDate, endDate },
  };
};