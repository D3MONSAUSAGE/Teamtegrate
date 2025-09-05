import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TeamMemberWithDetails {
  id: string;
  team_id: string;
  user_id: string;
  role: 'manager' | 'member' | 'admin';
  joined_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
  team: {
    id: string;
    name: string;
  };
}

export interface TeamMemberPerformanceData {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'member' | 'admin';
  systemRole: string; // System role from users table
  avatar_url?: string;
  team_id: string;
  team_name: string;
  joined_at: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
  overdueTasks: number;
  recentActivity: Array<{
    date: string;
    tasksCompleted: number;
  }>;
  workloadScore: number;
  projects: number;
}

export const useRealTeamMembers = (teamId?: string) => {
  const { user } = useAuth();

  // Fetch team members with user details
  const { data: teamMembers = [], isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ['team-members', teamId, user?.organizationId],
    queryFn: async (): Promise<TeamMemberWithDetails[]> => {
      if (!user?.organizationId) return [];

      let query = supabase
        .from('team_memberships')
        .select(`
          id,
          team_id,
          user_id,
          role,
          joined_at,
          user:users!team_memberships_user_id_fkey (
            id,
            name,
            email,
            role,
            avatar_url
          ),
          team:teams!team_memberships_team_id_fkey (
            id,
            name
          )
        `)
        .eq('teams.organization_id', user.organizationId)
        .eq('teams.is_active', true);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        role: item.role as 'manager' | 'member' | 'admin'
      }));
    },
    enabled: !!user?.organizationId,
  });

  // Fetch tasks for performance calculation
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['team-tasks', teamId, user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', user.organizationId);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId,
  });

  // Calculate performance data
  const teamMembersWithPerformance: TeamMemberPerformanceData[] = teamMembers
    .filter(member => member.user && member.team) // Filter out members with missing user or team data
    .map(member => {
    const userTasks = tasks.filter(task => 
      task.user_id === member.user_id || 
      task.assigned_to_id === member.user_id ||
      (task.assigned_to_ids && task.assigned_to_ids.includes(member.user_id))
    );

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(task => task.status === 'Completed').length;
    const inProgressTasks = userTasks.filter(task => task.status === 'In Progress').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const overdueTasks = userTasks.filter(task => {
      const deadline = new Date(task.deadline);
      return deadline < new Date() && task.status !== 'Completed';
    }).length;

    // Generate recent activity (last 7 days)
    const recentActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      const dayTasks = userTasks.filter(task => {
        if (!task.updated_at) return false;
        const taskDate = new Date(task.updated_at);
        return taskDate.toDateString() === date.toDateString() && task.status === 'Completed';
      });

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        tasksCompleted: dayTasks.length
      };
    });

    const workloadScore = Math.min(100, Math.round((totalTasks / 10) * 100));
    const projectIds = new Set(userTasks.map(task => task.project_id).filter(Boolean));

    return {
      id: member.user_id,
      name: member.user?.name || 'Unknown User',
      email: member.user?.email || 'unknown@example.com',
      role: member.role,
      systemRole: member.user?.role || 'user',
      avatar_url: member.user?.avatar_url,
      team_id: member.team_id,
      team_name: member.team?.name || 'Unknown Team',
      joined_at: member.joined_at,
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionRate,
      overdueTasks,
      recentActivity,
      workloadScore,
      projects: projectIds.size
    };
  });

  return {
    teamMembers: teamMembersWithPerformance,
    isLoading: membersLoading || tasksLoading,
    error: membersError,
    refetch: () => {
      // This would trigger refetch of both queries
    }
  };
};