import { useState, useEffect, useMemo } from 'react';
import { useOrganizationUsers } from './useOrganizationUsers';
import { useTask } from '@/contexts/task';
import { TeamMemberPerformance } from '@/types/performance';
import { convertTeamMembersToUsers } from '@/utils/teamMemberConverter';

export const useTeamMembers = () => {
  const { users, loading, error } = useOrganizationUsers();
  const { tasks, projects } = useTask();

  // Convert users to team members format for backward compatibility
  const teamMembers = useMemo(() => {
    return users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      organization_id: user.id // Use id as fallback since OrganizationUser doesn't have organization_id
    }));
  }, [users]);

  const teamMembersPerformance: TeamMemberPerformance[] = useMemo(() => {
    if (!users.length || !tasks.length) return [];

    return users.map(user => {
      // Get tasks assigned to or created by this user
      const userTasks = tasks.filter(task => 
        task.userId === user.id || 
        task.assignedToId === user.id || 
        (task.assignedToIds && task.assignedToIds.includes(user.id))
      );

      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(task => task.status === 'Completed').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Get tasks due today
      const today = new Date();
      const dueTodayTasks = userTasks.filter(task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        return deadline.toDateString() === today.toDateString() && task.status !== 'Completed';
      }).length;

      // Get unique projects this user is involved in
      const projectIds = new Set(userTasks.map(task => task.projectId).filter(Boolean));
      const projectsCount = projectIds.size;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalTasks,
        completedTasks,
        completionRate,
        dueTodayTasks,
        projects: projectsCount
      };
    });
  }, [users, tasks]);

  // For manager performance, return single manager or null (expected by TeamPageContent)
  const managerPerformance = useMemo(() => {
    const managers = teamMembersPerformance.filter(member => {
      const user = users.find(u => u.id === member.id);
      return user && ['manager', 'admin', 'superadmin'].includes(user.role);
    });
    return managers.length > 0 ? managers[0] : null;
  }, [teamMembersPerformance, users]);

  // Calculate additional metrics for backward compatibility
  const unassignedTasks = useMemo(() => {
    return tasks.filter(task => !task.assignedToId && (!task.assignedToIds || task.assignedToIds.length === 0));
  }, [tasks]);

  const teamMembersCount = users.length;
  const totalTasksAssigned = tasks.filter(task => task.assignedToId || (task.assignedToIds && task.assignedToIds.length > 0)).length;
  const totalTasksCompleted = tasks.filter(task => task.status === 'Completed').length;
  const teamTasksAssigned = tasks.filter(task => {
    const assignedUser = users.find(u => u.id === task.assignedToId || (task.assignedToIds && task.assignedToIds.includes(u.id)));
    return assignedUser && assignedUser.role === 'user';
  }).length;
  const managerTasksAssigned = tasks.filter(task => {
    const assignedUser = users.find(u => u.id === task.assignedToId || (task.assignedToIds && task.assignedToIds.includes(u.id)));
    return assignedUser && ['manager', 'admin', 'superadmin'].includes(assignedUser.role);
  }).length;
  const unassignedTasksCount = unassignedTasks.length;
  const projectsCount = projects.length;

  // Mock functions for backward compatibility (these would need proper implementation)
  const removeTeamMember = async (memberId: string) => {
    console.log('Remove team member:', memberId);
    // This would need to be implemented with actual removal logic
  };

  const refreshTeamMembers = () => {
    // This would trigger a refetch of team members
  };

  return {
    teamMembers,
    teamMembersPerformance,
    managerPerformance,
    unassignedTasks,
    teamMembersCount,
    totalTasksAssigned,
    totalTasksCompleted,
    teamTasksAssigned,
    managerTasksAssigned,
    unassignedTasksCount,
    projectsCount,
    removeTeamMember,
    refreshTeamMembers,
    loading,
    isLoading: loading,
    error
  };
};

export default useTeamMembers;