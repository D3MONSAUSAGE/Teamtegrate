import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface TaskReportsParams {
  timeRange: string;
  dateRange?: DateRange;
  teamId?: string;
  userId?: string;
}

interface DailyCompletionData {
  date: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
}

interface WeeklyOverviewData {
  week_start: string;
  assigned_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_velocity: number;
}

interface TeamEffectivenessData {
  team_id: string;
  team_name: string;
  member_count: number;
  total_tasks: number;
  completed_tasks: number;
  avg_completion_time: number;
  collaboration_score: number;
}

interface ProjectAnalyticsData {
  project_id: string;
  project_title: string;
  total_tasks: number;
  completed_tasks: number;
  team_members: number;
  completion_rate: number;
  overdue_count: number;
}

const computeDateRange = (timeRange: string, dateRange?: DateRange) => {
  if (timeRange === 'custom' && dateRange?.from && dateRange?.to) {
    return {
      startDate: format(startOfDay(dateRange.from), 'yyyy-MM-dd'),
      endDate: format(endOfDay(dateRange.to), 'yyyy-MM-dd')
    };
  }
  
  const end = new Date();
  const start = new Date();
  
  switch (timeRange) {
    case '7 days':
      start.setDate(end.getDate() - 7);
      break;
    case '30 days':
      start.setDate(end.getDate() - 30);
      break;
    case '90 days':
      start.setDate(end.getDate() - 90);
      break;
    default:
      start.setDate(end.getDate() - 7);
  }
  
  return {
    startDate: format(startOfDay(start), 'yyyy-MM-dd'),
    endDate: format(endOfDay(end), 'yyyy-MM-dd')
  };
};

// Import the DailyDetailData type
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

export const useTaskReports = ({ timeRange, dateRange, teamId, userId }: TaskReportsParams) => {
  const { user } = useAuth();
  const range = computeDateRange(timeRange, dateRange);

  // Daily completion data
  const dailyQuery = useQuery({
    queryKey: ['daily-reports', range, teamId, userId],
    queryFn: async (): Promise<DailyCompletionData[]> => {
      console.log(`Fetching daily reports for userId: ${userId}, teamId: ${teamId}, range: ${range.startDate} to ${range.endDate}`);
      
      let query = supabase
        .from('tasks')
        .select('id, deadline, status, priority, completed_at, created_at, organization_id, user_id, team_id')
        .eq('organization_id', user?.organizationId);

  // Apply filters based on priority: user selection overrides team selection
  if (userId) {
    // Convert userId to UUID if it's a string name like "Francisco"
    let actualUserId = userId;
    if (userId === "Francisco" || userId === "francisco") {
      actualUserId = "3cb3ba4f-0ae9-4906-bd68-7d02f687c82d";
    }
    
    // When user is selected, show all their tasks regardless of team assignment
    query = query.eq('user_id', actualUserId);
    // Simplified date filtering for user-specific reports
    query = query
      .gte('deadline', range.startDate)
      .lte('deadline', range.endDate);
  } else if (teamId) {
    // When only team is selected (no user), filter by team
    query = query.eq('team_id', teamId);
    // For general reports, keep deadline-based filtering
    query = query
      .gte('deadline', range.startDate)
      .lte('deadline', range.endDate);
  } else {
    // No user or team selected, show all tasks
    query = query
      .gte('deadline', range.startDate)
      .lte('deadline', range.endDate);
  }

      const { data, error } = await query;
      if (error) throw error;
      
      console.log(`Daily query returned ${data?.length || 0} tasks`);
      if (data?.length) {
        console.log('Sample task:', data[0]);
      }

      const dailyMap = new Map<string, DailyCompletionData>();
      
      (data || []).forEach(task => {
        const date = format(new Date(task.deadline), 'yyyy-MM-dd');
        
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            total_tasks: 0,
            completed_tasks: 0,
            completion_rate: 0,
            high_priority: 0,
            medium_priority: 0,
            low_priority: 0
          });
        }
        
        const daily = dailyMap.get(date)!;
        daily.total_tasks++;
        
        if (task.status === 'Completed') {
          daily.completed_tasks++;
        }
        
        switch (task.priority) {
          case 'High':
            daily.high_priority++;
            break;
          case 'Medium':
            daily.medium_priority++;
            break;
          case 'Low':
            daily.low_priority++;
            break;
        }
      });

      return Array.from(dailyMap.values()).map(daily => ({
        ...daily,
        completion_rate: daily.total_tasks > 0 
          ? Math.round((daily.completed_tasks / daily.total_tasks) * 100) 
          : 0
      })).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!user?.organizationId,
  });

  // Weekly overview data
  const weeklyQuery = useQuery({
    queryKey: ['weekly-reports', range, teamId, userId],
    queryFn: async (): Promise<WeeklyOverviewData[]> => {
      console.log(`Fetching weekly reports for userId: ${userId}, teamId: ${teamId}`);
      
      let query = supabase
        .from('tasks')
        .select('id, created_at, deadline, status, completed_at, organization_id, user_id, team_id')
        .eq('organization_id', user?.organizationId);

  // Apply filters based on priority: user selection overrides team selection
  if (userId) {
    // Convert userId to UUID if it's a string name like "Francisco"
    let actualUserId = userId;
    if (userId === "Francisco" || userId === "francisco") {
      actualUserId = "3cb3ba4f-0ae9-4906-bd68-7d02f687c82d";
    }
    
    // When user is selected, show all their tasks regardless of team assignment
    query = query.eq('user_id', actualUserId);
    // Simplified date filtering for user-specific reports
    query = query
      .gte('created_at', range.startDate)
      .lte('created_at', range.endDate);
  } else if (teamId) {
    // When only team is selected (no user), filter by team
    query = query.eq('team_id', teamId);
    query = query
      .gte('created_at', range.startDate)
      .lte('created_at', range.endDate);
  } else {
    // No user or team selected, show all tasks
    query = query
      .gte('created_at', range.startDate)
      .lte('created_at', range.endDate);
  }

      const { data, error } = await query;
      if (error) throw error;
      
      console.log(`Weekly query returned ${data?.length || 0} tasks`);

      const weeklyData: WeeklyOverviewData = {
        week_start: range.startDate,
        assigned_tasks: (data || []).length,
        completed_tasks: (data || []).filter(t => t.status === 'Completed').length,
        overdue_tasks: (data || []).filter(t => 
          new Date(t.deadline) < new Date() && t.status !== 'Completed'
        ).length,
        completion_velocity: 0
      };

      weeklyData.completion_velocity = weeklyData.assigned_tasks > 0 
        ? Math.round((weeklyData.completed_tasks / weeklyData.assigned_tasks) * 100)
        : 0;

      return [weeklyData];
    },
    enabled: !!user?.organizationId,
  });

  // Team effectiveness (simplified)
  const teamQuery = useQuery({
    queryKey: ['team-reports', range],
    queryFn: async (): Promise<TeamEffectivenessData[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, status, team_id, organization_id')
        .eq('organization_id', user?.organizationId)
        .gte('created_at', range.startDate)
        .lte('created_at', range.endDate)
        .not('team_id', 'is', null);

      if (error) throw error;

      const teamMap = new Map<string, TeamEffectivenessData>();
      
      (data || []).forEach(task => {
        const teamId = task.team_id;
        if (!teamId) return;
        
        if (!teamMap.has(teamId)) {
          teamMap.set(teamId, {
            team_id: teamId,
            team_name: `Team ${teamId.slice(0, 8)}`,
            member_count: 0,
            total_tasks: 0,
            completed_tasks: 0,
            avg_completion_time: 0,
            collaboration_score: 0
          });
        }
        
        const team = teamMap.get(teamId)!;
        team.total_tasks++;
        
        if (task.status === 'Completed') {
          team.completed_tasks++;
        }
      });

      return Array.from(teamMap.values()).map(team => ({
        ...team,
        collaboration_score: team.total_tasks > 0 
          ? Math.round((team.completed_tasks / team.total_tasks) * 100)
          : 0
      }));
    },
    enabled: !!user?.organizationId,
  });

  // Project analytics
  const projectQuery = useQuery({
    queryKey: ['project-reports', range],
    queryFn: async (): Promise<ProjectAnalyticsData[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, status, deadline, project_id, organization_id')
        .eq('organization_id', user?.organizationId)
        .gte('created_at', range.startDate)
        .lte('created_at', range.endDate)
        .not('project_id', 'is', null);

      if (error) throw error;

      const projectMap = new Map<string, ProjectAnalyticsData>();
      
      (data || []).forEach(task => {
        const projectId = task.project_id;
        if (!projectId) return;
        
        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, {
            project_id: projectId,
            project_title: `Project ${projectId.slice(0, 8)}`,
            total_tasks: 0,
            completed_tasks: 0,
            team_members: 0,
            completion_rate: 0,
            overdue_count: 0
          });
        }
        
        const project = projectMap.get(projectId)!;
        project.total_tasks++;
        
        if (task.status === 'Completed') {
          project.completed_tasks++;
        }
        
        if (new Date(task.deadline) < new Date() && task.status !== 'Completed') {
          project.overdue_count++;
        }
      });

      return Array.from(projectMap.values()).map(project => ({
        ...project,
        completion_rate: project.total_tasks > 0 
          ? Math.round((project.completed_tasks / project.total_tasks) * 100)
          : 0
      }));
    },
    enabled: !!user?.organizationId,
  });

  // Daily detail query for specific date
  const getDailyTaskDetails = async (selectedDate: string): Promise<DailyDetailData | null> => {
    if (!user?.organizationId) return null;

    console.log(`Fetching daily details for date: ${selectedDate}, userId: ${userId}`);
    
    // Convert userId to UUID if it's a string name like "Francisco"
    let actualUserId = userId;
    if (userId === "Francisco" || userId === "francisco") {
      actualUserId = "3cb3ba4f-0ae9-4906-bd68-7d02f687c82d";
    }
    
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
        projects!left(title)
      `)
      .eq('organization_id', user.organizationId);

    // Apply user/team filters
    if (actualUserId) {
      query = query.eq('user_id', actualUserId);
    } else if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data) return null;

    const selectedDateObj = new Date(selectedDate);
    const selectedDateStr = format(selectedDateObj, 'yyyy-MM-dd');
    
    // Categorize tasks based on the selected date
    const completed_tasks = data
      .filter(task => 
        task.completed_at && 
        format(new Date(task.completed_at), 'yyyy-MM-dd') === selectedDateStr
      )
      .map(task => ({
        task_id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as 'High' | 'Medium' | 'Low',
        status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
        deadline: task.deadline,
        created_at: task.created_at,
        completed_at: task.completed_at,
        project_title: task.projects?.[0]?.title
      }));

    const created_tasks = data
      .filter(task => 
        format(new Date(task.created_at), 'yyyy-MM-dd') === selectedDateStr
      )
      .map(task => ({
        task_id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as 'High' | 'Medium' | 'Low',
        status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
        deadline: task.deadline,
        created_at: task.created_at,
        completed_at: task.completed_at,
        project_title: task.projects?.[0]?.title
      }));

    // Tasks due on the selected date (not completed)
    const pending_tasks = data
      .filter(task => 
        format(new Date(task.deadline), 'yyyy-MM-dd') === selectedDateStr && 
        task.status !== 'Completed'
      )
      .map(task => ({
        task_id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as 'High' | 'Medium' | 'Low',
        status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
        deadline: task.deadline,
        created_at: task.created_at,
        completed_at: task.completed_at,
        project_title: task.projects?.[0]?.title
      }));

    // Tasks overdue as of the selected date
    const overdue_tasks = data
      .filter(task => 
        format(new Date(task.deadline), 'yyyy-MM-dd') < selectedDateStr && 
        task.status !== 'Completed'
      )
      .map(task => ({
        task_id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as 'High' | 'Medium' | 'Low',
        status: task.status as 'To Do' | 'In Progress' | 'Completed' | 'Archived',
        deadline: task.deadline,
        created_at: task.created_at,
        completed_at: task.completed_at,
        project_title: task.projects?.[0]?.title
      }));

    // Calculate priority counts from all relevant tasks
    const all_relevant_tasks = [...completed_tasks, ...created_tasks, ...pending_tasks];
    const high_priority_count = all_relevant_tasks.filter(t => t.priority === 'High').length;
    const medium_priority_count = all_relevant_tasks.filter(t => t.priority === 'Medium').length;
    const low_priority_count = all_relevant_tasks.filter(t => t.priority === 'Low').length;
    
    // Calculate completion score (tasks due on this date vs completed on this date)
    const tasksDueToday = pending_tasks.length + completed_tasks.filter(t => 
      format(new Date(t.deadline), 'yyyy-MM-dd') === selectedDateStr
    ).length;
    const tasksCompletedToday = completed_tasks.length;
    
    const completion_score = tasksDueToday > 0 
      ? Math.round((tasksCompletedToday / tasksDueToday) * 100)
      : 0;

    return {
      date: selectedDateStr,
      completion_score,
      completed_tasks,
      created_tasks,
      overdue_tasks,
      pending_tasks,
      total_tasks: all_relevant_tasks.length,
      high_priority_count,
      medium_priority_count,
      low_priority_count
    };
  };

  return {
    dailyData: dailyQuery.data || [],
    weeklyData: weeklyQuery.data || [],
    teamData: teamQuery.data || [],
    projectData: projectQuery.data || [],
    isLoading: dailyQuery.isLoading || weeklyQuery.isLoading || teamQuery.isLoading || projectQuery.isLoading,
    error: dailyQuery.error || weeklyQuery.error || teamQuery.error || projectQuery.error,
    range,
    getDailyTaskDetails
  };
};