import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ReportFilter } from '@/types/reports';
import { getUserDailyReport, getUserWeeklyReport } from '@/services/reportsService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';

// Stable query key functions
const keyDaily = (f: ReportFilter) =>
  ["report:user:day", f.orgId, f.userId ?? "", (f.teamIds ?? []).join(","), f.dateISO, f.timezone];

const keyWeekly = (f: ReportFilter) =>
  ["report:user:week", f.orgId, f.userId ?? "", (f.teamIds ?? []).join(","), f.weekStartISO ?? "", f.timezone];

export interface DailyReportData {
  current_due: number;
  overdue: number;
  completed: number;
  created: number;
  assigned: number;
  daily_score: number;
  total_due_today: number;
}

export interface WeeklyReportData {
  assigned: number;
  completed: number;
  created: number;
  current_due: number;
  daily_score: number;
  overdue: number;
  total_due: number; // RPC uses this name instead of total_due_today
  day_date?: string; // RPC includes this field
}

// Centralized daily report hook
export function useDailyReport(filter: ReportFilter) {
  return useQuery({
    queryKey: keyDaily(filter),
    queryFn: async (): Promise<DailyReportData> => {
      return await getUserDailyReport(filter);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: !!filter.orgId && !!filter.dateISO && filter.view === 'daily',
  });
}

// Centralized weekly report hook  
export function useWeeklyReport(filter: ReportFilter) {
  return useQuery({
    queryKey: keyWeekly(filter),
    queryFn: async (): Promise<WeeklyReportData[]> => {
      return await getUserWeeklyReport(filter);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: !!filter.orgId && !!filter.weekStartISO && filter.view === 'weekly',
  });
}

// Legacy task detail interface for backward compatibility
export interface DailyDetailData {
  date: string;
  completion_score: number;
  completed_tasks: Array<{
    task_id: string;
    title: string;
    description?: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'To Do' | 'In Progress' | 'Completed' | 'Archived';
    deadline: string;
    created_at: string;
    completed_at?: string;
    project_title?: string;
  }>;
  created_tasks: Array<{
    task_id: string;
    title: string;
    description?: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'To Do' | 'In Progress' | 'Completed' | 'Archived';
    deadline: string;
    created_at: string;
    completed_at?: string;
    project_title?: string;
  }>;
  assigned_tasks: Array<{
    task_id: string;
    title: string;
    description?: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'To Do' | 'In Progress' | 'Completed' | 'Archived';
    deadline: string;
    created_at: string;
    completed_at?: string;
    project_title?: string;
    assigned_to_name?: string;
    assigned_by_name?: string;
  }>;
  overdue_tasks: Array<{
    task_id: string;
    title: string;
    description?: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'To Do' | 'In Progress' | 'Completed' | 'Archived';
    deadline: string;
    created_at: string;
    completed_at?: string;
    project_title?: string;
  }>;
  pending_tasks: Array<{
    task_id: string;
    title: string;
    description?: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'To Do' | 'In Progress' | 'Completed' | 'Archived';
    deadline: string;
    created_at: string;
    completed_at?: string;
    project_title?: string;
  }>;
  total_tasks: number;
  high_priority_count: number;
  medium_priority_count: number;
  low_priority_count: number;
}

// Legacy hook for backward compatibility - DEPRECATED: Use useDailyReport/useWeeklyReport instead
export const useTaskReports = (params: any) => {
  const { user } = useAuth();

  // Daily detail query for specific date - legacy support
  const getDailyTaskDetails = React.useCallback(async (selectedDate: string): Promise<DailyDetailData | null> => {
    if (!user?.organizationId) return null;

    console.log(`[LEGACY] Fetching daily details for date: ${selectedDate}, userId: ${params.userId}`);
    
    // Fetch all tasks with broader date range to ensure we capture all relevant data
    const startOfMonth = format(subDays(new Date(selectedDate), 30), 'yyyy-MM-dd');
    const endOfMonth = format(new Date(selectedDate), 'yyyy-MM-dd');
    
    let query = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        priority,
        status,
        deadline,
        created_at,
        completed_at,
        user_id,
        team_id,
        organization_id,
        assigned_to_id,
        assigned_to_ids,
        project_id
      `)
      .eq('organization_id', user.organizationId)
      .or(`deadline.gte.${startOfMonth},created_at.gte.${startOfMonth},completed_at.gte.${startOfMonth}`);

    // Apply user/team filters with proper priority
    if (params.userId) {
      // For user-specific reports, show tasks assigned to this user
      query = query.or(`user_id.eq.${params.userId},assigned_to_id.eq.${params.userId}`);
    } else if (params.teamId) {
      query = query.eq('team_id', params.teamId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching daily task details:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No tasks found for the query');
      return {
        date: selectedDate,
        completion_score: 0,
        completed_tasks: [],
        created_tasks: [],
        assigned_tasks: [],
        overdue_tasks: [],
        pending_tasks: [],
        total_tasks: 0,
        high_priority_count: 0,
        medium_priority_count: 0,
        low_priority_count: 0
      };
    }

    console.log(`Found ${data.length} total tasks to process`);
    
    const selectedDateObj = new Date(selectedDate);
    const selectedDateStr = format(selectedDateObj, 'yyyy-MM-dd');
    
    // Tasks completed ON the selected date
    const completed_tasks = data
      .filter(task => {
        if (!task.completed_at) return false;
        const completedDate = format(new Date(task.completed_at), 'yyyy-MM-dd');
        return completedDate === selectedDateStr;
      })
      .map(task => ({
        task_id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as 'High' | 'Medium' | 'Low',
        status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
        deadline: task.deadline,
        created_at: task.created_at,
        completed_at: task.completed_at,
        project_title: null
      }));

    // Tasks created ON the selected date
    const created_tasks = data
      .filter(task => {
        const createdDate = format(new Date(task.created_at), 'yyyy-MM-dd');
        return createdDate === selectedDateStr;
      })
      .map(task => ({
        task_id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as 'High' | 'Medium' | 'Low',
        status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
        deadline: task.deadline,
        created_at: task.created_at,
        completed_at: task.completed_at,
        project_title: null
      }));

    // Tasks with assignment activity on the selected date
    const assigned_tasks = data
      .filter(task => {
        const createdDate = format(new Date(task.created_at), 'yyyy-MM-dd');
        const hasAssignment = task.assigned_to_id || (task.assigned_to_ids && task.assigned_to_ids.length > 0);
        return createdDate === selectedDateStr && hasAssignment && task.assigned_to_id !== task.user_id;
      })
      .map(task => ({
        task_id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as 'High' | 'Medium' | 'Low',
        status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
        deadline: task.deadline,
        created_at: task.created_at,
        completed_at: task.completed_at,
        project_title: null,
        assigned_to_name: 'Assigned User',
        assigned_by_name: 'Manager'
      }));

    // Tasks DUE on the selected date (not completed)
    const pending_tasks = data
      .filter(task => {
        const deadlineDate = format(new Date(task.deadline), 'yyyy-MM-dd');
        return deadlineDate === selectedDateStr && task.status !== 'Completed';
      })
      .map(task => ({
        task_id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as 'High' | 'Medium' | 'Low',
        status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
        deadline: task.deadline,
        created_at: task.created_at,
        completed_at: task.completed_at,
        project_title: null
      }));

    // Tasks OVERDUE as of the selected date (deadline before selected date, not completed)
    const overdue_tasks = data
      .filter(task => {
        if (task.status === 'Completed') return false;
        const deadlineDate = new Date(task.deadline);
        const selectedDate = new Date(selectedDateStr);
        return deadlineDate < selectedDate;
      })
      .map(task => ({
        task_id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as 'High' | 'Medium' | 'Low',
        status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
        deadline: task.deadline,
        created_at: task.created_at,
        completed_at: task.completed_at,
        project_title: null
      }));

    // Calculate priority counts from tasks relevant to this date
    const all_relevant_tasks = [...completed_tasks, ...created_tasks, ...pending_tasks];
    const high_priority_count = all_relevant_tasks.filter(t => t.priority === 'High').length;
    const medium_priority_count = all_relevant_tasks.filter(t => t.priority === 'Medium').length;
    const low_priority_count = all_relevant_tasks.filter(t => t.priority === 'Low').length;
    
    // Calculate completion score: tasks completed today vs tasks due today
    const tasksDueToday = pending_tasks.length + completed_tasks.filter(t => 
      format(new Date(t.deadline), 'yyyy-MM-dd') === selectedDateStr
    ).length;
    const tasksCompletedToday = completed_tasks.filter(t => 
      format(new Date(t.deadline), 'yyyy-MM-dd') === selectedDateStr
    ).length;
    
    const completion_score = tasksDueToday > 0 
      ? Math.round((tasksCompletedToday / tasksDueToday) * 100)
      : tasksCompletedToday > 0 ? 100 : 0;

    return {
      date: selectedDateStr,
      completion_score,
      completed_tasks,
      created_tasks,
      assigned_tasks,
      overdue_tasks,
      pending_tasks,
      total_tasks: all_relevant_tasks.length,
      high_priority_count,
      medium_priority_count,
      low_priority_count
    };
  }, [user?.organizationId, params.teamId, params.userId]);

  return {
    // Legacy empty data for backward compatibility
    dailyData: [],
    weeklyData: [],
    teamData: [],
    projectData: [],
    isLoading: false,
    error: null,
    range: { startDate: '', endDate: '' },
    getDailyTaskDetails
  };
};