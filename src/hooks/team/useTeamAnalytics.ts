import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTeamMembers } from './useRealTeamMembers';
import { useEffect } from 'react';

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
    queryKey: ['team-analytics', teamId, user?.organizationId, teamMembers.map(m => m.id).join(',')],
    queryFn: async (): Promise<TeamAnalytics | null> => {
      if (!teamId || !user?.organizationId || teamMembers.length === 0) return null;

      // Fetch team details
      const { data: team } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single();

      if (!team) return null;

      // Fetch all organization tasks (not filtered by team_id)
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', user.organizationId);

      const organizationTasks = allTasks || [];
      
      // Get team member IDs
      const memberIds = teamMembers.map(member => member.id);
      
      // Derive team tasks from member assignments AND team_id matches
      const teamTasks = organizationTasks.filter(task => {
        return (
          // Task is explicitly assigned to this team
          task.team_id === teamId ||
          // Task is assigned to a team member via user_id
          memberIds.includes(task.user_id) ||
          // Task is assigned to a team member via assigned_to_id
          memberIds.includes(task.assigned_to_id) ||
          // Task is assigned to team members via assigned_to_ids array
          (Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.some(id => memberIds.includes(id)))
        );
      });

      const totalTasks = teamTasks.length;
      const completedTasks = teamTasks.filter(t => t.status === 'Completed').length;
      const inProgressTasks = teamTasks.filter(t => t.status === 'In Progress').length;
      const overdueTasks = teamTasks.filter(t => {
        if (!t.deadline || t.status === 'Completed') return false;
        const deadline = new Date(t.deadline);
        return deadline < new Date();
      }).length;

      // Calculate average completion rate from team members' individual rates
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

      // Calculate workload distribution based on team members' task counts
      const workloadDistribution = teamMembers.map(member => {
        const workloadPercentage = totalTasks > 0 
          ? Math.round((member.totalTasks / totalTasks) * 100) 
          : 0;

        return {
          memberId: member.id,
          memberName: member.name || 'Unknown User',
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
            name: topPerformer.name || 'Unknown User',
            completionRate: topPerformer.completionRate
          } : null,
          mostActive: mostActive ? {
            name: mostActive.name || 'Unknown User',
            totalTasks: mostActive.totalTasks
          } : null,
          teamVelocity
        }
      };
    },
    enabled: !!teamId && !!user?.organizationId && !membersLoading && teamMembers.length > 0,
  });

  const queryClient = useQueryClient();

  // Set up real-time subscription to tasks to keep analytics fresh
  useEffect(() => {
    if (!user?.organizationId || !teamId) return;

    const channel = supabase
      .channel('team-analytics-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `organization_id=eq.${user.organizationId}`
        },
        () => {
          // Invalidate analytics queries when tasks change
          queryClient.invalidateQueries({ queryKey: ['team-analytics', teamId] });
          queryClient.invalidateQueries({ queryKey: ['organization-tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.organizationId, teamId, queryClient]);

  return {
    analytics: analyticsData,
    isLoading: analyticsLoading || membersLoading,
    error
  };
};