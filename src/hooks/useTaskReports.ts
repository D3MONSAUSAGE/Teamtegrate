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
        // When user is selected, show all their tasks regardless of team assignment
        query = query.eq('user_id', userId);
        // For user-specific reports, use more inclusive date filtering with proper OR syntax
        query = query.or(`and(deadline.gte.${range.startDate},deadline.lte.${range.endDate}),and(created_at.gte.${range.startDate},created_at.lte.${range.endDate}),and(completed_at.gte.${range.startDate},completed_at.lte.${range.endDate})`);
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
        // When user is selected, show all their tasks regardless of team assignment
        query = query.eq('user_id', userId);
        // For user-specific reports, use more inclusive date filtering
        query = query.or(`and(deadline.gte.${range.startDate},deadline.lte.${range.endDate}),and(created_at.gte.${range.startDate},created_at.lte.${range.endDate}),and(completed_at.gte.${range.startDate},completed_at.lte.${range.endDate})`);
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

  return {
    dailyData: dailyQuery.data || [],
    weeklyData: weeklyQuery.data || [],
    teamData: teamQuery.data || [],
    projectData: projectQuery.data || [],
    isLoading: dailyQuery.isLoading || weeklyQuery.isLoading || teamQuery.isLoading || projectQuery.isLoading,
    error: dailyQuery.error || weeklyQuery.error || teamQuery.error || projectQuery.error,
    range
  };
};