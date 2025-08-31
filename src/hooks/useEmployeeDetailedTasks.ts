import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';

export type EmployeeDetailedTasksParams = {
  userId: string;
  timeRange: string;
  dateRange?: DateRange;
};

export interface DetailedTask {
  task_id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  project_id: string | null;
  project_title: string;
  time_spent_minutes: number;
  is_overdue: boolean;
  days_until_due: number | null;
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

  // Format YYYY-MM-DD for SQL date params
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

export const useEmployeeDetailedTasks = ({ userId, timeRange, dateRange }: EmployeeDetailedTasksParams) => {
  const { startDate, endDate } = useMemo(() => computeRange(timeRange, dateRange), [timeRange, dateRange]);

  const detailedTasksQuery = useQuery({
    queryKey: ['employee-detailed-tasks', userId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_employee_detailed_tasks', {
        target_user_id: userId,
        start_date: startDate,
        end_date: endDate,
      });
      if (error) throw error;
      return (data as DetailedTask[]) || [];
    },
    enabled: !!userId,
  });

  const processedData = useMemo(() => {
    const tasks = detailedTasksQuery.data || [];
    
    // Group tasks by status
    const todoTasks = tasks.filter(task => task.status === 'To Do');
    const inProgressTasks = tasks.filter(task => task.status === 'In Progress');
    const completedTasks = tasks.filter(task => task.status === 'Completed');
    const overdueTasks = tasks.filter(task => task.is_overdue);
    
    // Group by priority
    const highPriorityTasks = tasks.filter(task => task.priority === 'High');
    const mediumPriorityTasks = tasks.filter(task => task.priority === 'Medium');
    const lowPriorityTasks = tasks.filter(task => task.priority === 'Low');
    
    // Calculate totals
    const totalTasks = tasks.length;
    const totalTimeSpent = tasks.reduce((sum, task) => sum + task.time_spent_minutes, 0);
    
    // Group by project
    const projectGroups = tasks.reduce((acc, task) => {
      const projectKey = task.project_title;
      if (!acc[projectKey]) {
        acc[projectKey] = [];
      }
      acc[projectKey].push(task);
      return acc;
    }, {} as Record<string, DetailedTask[]>);

    return {
      allTasks: tasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      projectGroups,
      summary: {
        totalTasks,
        completedCount: completedTasks.length,
        overdueCount: overdueTasks.length,
        highPriorityCount: highPriorityTasks.length,
        totalTimeSpentHours: Math.round(totalTimeSpent / 60 * 10) / 10,
        avgTimePerTask: totalTasks > 0 ? Math.round(totalTimeSpent / totalTasks) : 0,
        completionRate: totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
      }
    };
  }, [detailedTasksQuery.data]);

  return {
    ...processedData,
    isLoading: detailedTasksQuery.isLoading,
    error: detailedTasksQuery.error,
    range: { startDate, endDate },
  };
};