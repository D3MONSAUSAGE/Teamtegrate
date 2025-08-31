import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';

export type DetailedTask = {
  task_id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  project_id: string | null;
  project_title: string;
  time_spent_minutes: number;
  is_overdue: boolean;
  days_until_due: number | null;
};

export type EmployeeDetailedTasksParams = {
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
    end.setTime(dateRange.to.getTime());
  } else {
    start.setDate(end.getDate() - 30);
  }

  // format YYYY-MM-DD for SQL date params
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

  // Process and categorize tasks
  const processedData = useMemo(() => {
    const tasks = detailedTasksQuery.data || [];
    
    const todoTasks = tasks.filter(task => task.status === 'To Do');
    const inProgressTasks = tasks.filter(task => task.status === 'In Progress');
    const completedTasks = tasks.filter(task => task.status === 'Completed');
    const overdueTasks = tasks.filter(task => task.is_overdue);
    
    const highPriorityTasks = tasks.filter(task => task.priority === 'High');
    const mediumPriorityTasks = tasks.filter(task => task.priority === 'Medium');
    const lowPriorityTasks = tasks.filter(task => task.priority === 'Low');
    
    const totalTimeSpent = tasks.reduce((sum, task) => sum + task.time_spent_minutes, 0);
    
    // Group by project
    const tasksByProject = tasks.reduce((acc, task) => {
      const projectTitle = task.project_title || 'No Project';
      if (!acc[projectTitle]) {
        acc[projectTitle] = [];
      }
      acc[projectTitle].push(task);
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
      tasksByProject,
      totalTimeSpent,
      summary: {
        total: tasks.length,
        todo: todoTasks.length,
        inProgress: inProgressTasks.length,
        completed: completedTasks.length,
        overdue: overdueTasks.length,
        highPriority: highPriorityTasks.length,
        mediumPriority: mediumPriorityTasks.length,
        lowPriority: lowPriorityTasks.length,
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