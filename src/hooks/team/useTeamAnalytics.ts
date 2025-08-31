import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTeamMembers } from './useRealTeamMembers';

export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  memberCount: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  averageCompletionRate: number;
  productivityTrend: Array<{
    period: string;
    completed: number;
    assigned: number;
  }>;
  workloadDistribution: Array<{
    memberId: string;
    memberName: string;
    taskCount: number;
    workloadPercentage: number;
  }>;
  performanceMetrics: {
    topPerformer: { name: string; completionRate: number } | null;
    mostActive: { name: string; totalTasks: number } | null;
    teamVelocity: number;
  };
}

export const useTeamAnalytics = (teamId?: string) => {
  const { user } = useAuth();
  const { teamMembers, isLoading: membersLoading } = useRealTeamMembers(teamId);

  // Fetch team analytics data
  const { data: analyticsData, isLoading: analyticsLoading, error } = useQuery({
    queryKey: ['team-analytics', teamId, user?.organizationId],
    queryFn: async (): Promise<TeamAnalytics | null> => {
      if (!teamId || !user?.organizationId) return null;

      // Fetch team details
      const { data: team } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single();

      if (!team) return null;

      // Fetch team tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('team_id', teamId)
        .eq('organization_id', user.organizationId);

      const teamTasks = tasks || [];
      const totalTasks = teamTasks.length;
      const completedTasks = teamTasks.filter(t => t.status === 'Completed').length;
      const inProgressTasks = teamTasks.filter(t => t.status === 'In Progress').length;
      const overdueTasks = teamTasks.filter(t => {
        if (!t.deadline || t.status === 'Completed') return false;
        const deadline = new Date(t.deadline);
        return deadline < new Date();
      }).length;

      // Calculate average completion rate
      const averageCompletionRate = teamMembers.length > 0
        ? teamMembers.reduce((sum, member) => sum + member.completionRate, 0) / teamMembers.length
        : 0;

      // Generate productivity trend (last 6 weeks)
      const productivityTrend = Array.from({ length: 6 }, (_, i) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (5 - i) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekTasks = teamTasks.filter(task => {
          const createdDate = new Date(task.created_at);
          return createdDate >= weekStart && createdDate <= weekEnd;
        });

        const weekCompleted = teamTasks.filter(task => {
          if (!task.updated_at || task.status !== 'Completed') return false;
          const completedDate = new Date(task.updated_at);
          return completedDate >= weekStart && completedDate <= weekEnd;
        });

        return {
          period: `Week ${i + 1}`,
          completed: weekCompleted.length,
          assigned: weekTasks.length
        };
      });

      // Calculate workload distribution
      const workloadDistribution = teamMembers.map(member => {
        const workloadPercentage = totalTasks > 0 
          ? Math.round((member.totalTasks / totalTasks) * 100) 
          : 0;

        return {
          memberId: member.id,
          memberName: member.name,
          taskCount: member.totalTasks,
          workloadPercentage
        };
      });

      // Performance metrics
      const topPerformer = teamMembers.length > 0
        ? teamMembers.reduce((top, member) => 
            member.completionRate > top.completionRate ? member : top
          )
        : null;

      const mostActive = teamMembers.length > 0
        ? teamMembers.reduce((active, member) => 
            member.totalTasks > active.totalTasks ? member : active
          )
        : null;

      // Team velocity (tasks completed per week)
      const weeksInPeriod = 4;
      const recentCompletedTasks = teamTasks.filter(task => {
        if (!task.updated_at || task.status !== 'Completed') return false;
        const completedDate = new Date(task.updated_at);
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - (weeksInPeriod * 7));
        return completedDate >= fourWeeksAgo;
      }).length;

      const teamVelocity = Math.round(recentCompletedTasks / weeksInPeriod);

      return {
        teamId,
        teamName: team.name,
        memberCount: teamMembers.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        averageCompletionRate: Math.round(averageCompletionRate),
        productivityTrend,
        workloadDistribution,
        performanceMetrics: {
          topPerformer: topPerformer ? {
            name: topPerformer.name,
            completionRate: topPerformer.completionRate
          } : null,
          mostActive: mostActive ? {
            name: mostActive.name,
            totalTasks: mostActive.totalTasks
          } : null,
          teamVelocity
        }
      };
    },
    enabled: !!teamId && !!user?.organizationId && !membersLoading,
  });

  return {
    analytics: analyticsData,
    isLoading: analyticsLoading || membersLoading,
    error
  };
};