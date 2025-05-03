
import { Task } from '@/types';
import { TeamMember, TeamMemberPerformance } from '@/types/team';
import { PerformanceChartData } from '@/types/performance';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

/**
 * Calculate performance metrics for team members based on their assigned tasks
 */
export const calculateTeamMembersPerformance = (
  teamMembers: TeamMember[],
  tasks: Task[]
): TeamMemberPerformance[] => {
  return teamMembers.map((member) => {
    // Get all tasks assigned to this team member
    const assignedTasks = tasks.filter(task => task.assignedToId === member.id);
    
    // Count completed tasks
    const completedTasks = assignedTasks.filter(task => task.status === 'Completed').length;
    
    // Calculate completion rate
    const completionRate = assignedTasks.length > 0
      ? Math.round((completedTasks / assignedTasks.length) * 100)
      : 0;
    
    // Get tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueTodayTasks = assignedTasks.filter((task) => {
      if (!task.deadline) return false;
      
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    // Track projects this member is involved in
    const memberProjectIds = new Set<string>();
    assignedTasks.forEach(task => {
      if (task.projectId) {
        memberProjectIds.add(task.projectId);
      }
    });
    
    // Convert Set to Array for convenient access
    const projectIdsArray = Array.from(memberProjectIds);
    
    return {
      ...member,
      assignedTasks,
      completedTasks,
      totalTasks: assignedTasks.length,
      completionRate,
      dueTodayTasks: dueTodayTasks.length,
      projects: projectIdsArray.length,
      projectIds: projectIdsArray,
    };
  });
};

/**
 * Generate data specifically for the team performance bar chart
 */
export const generateMemberPerformanceChartData = (
  teamMembersPerformance: TeamMemberPerformance[]
): PerformanceChartData[] => {
  return teamMembersPerformance.map(member => ({
    name: member.name,
    assignedTasks: member.totalTasks,
    completedTasks: member.completedTasks,
    completionRate: member.completionRate
  }));
};

/**
 * Calculate summary statistics for the team
 */
export const calculateTeamSummaryStats = (teamMembersPerformance: TeamMemberPerformance[]) => {
  const totalTasksAssigned = teamMembersPerformance.reduce(
    (sum, member) => sum + member.totalTasks, 0
  );
  
  const totalTasksCompleted = teamMembersPerformance.reduce(
    (sum, member) => sum + member.completedTasks, 0
  );
  
  const totalCompletionRate = totalTasksAssigned > 0 
    ? Math.round((totalTasksCompleted / totalTasksAssigned) * 100)
    : 0;
    
  return {
    totalTasksAssigned,
    totalTasksCompleted,
    totalCompletionRate
  };
};

/**
 * Get this week's performance data for team members
 */
export const getWeeklyTeamPerformance = (
  teamMembers: TeamMember[],
  tasks: Task[]
): TeamMemberPerformance[] => {
  // Get the current week's date range
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  
  // Filter tasks that are due this week
  const weeklyTasks = tasks.filter(task => {
    if (!task.deadline) return false;
    
    const taskDate = new Date(task.deadline);
    return isWithinInterval(taskDate, {
      start: weekStart,
      end: weekEnd
    });
  });
  
  // Calculate performance based on weekly tasks
  return teamMembers.map((member) => {
    // Get weekly tasks assigned to this team member
    const assignedTasks = weeklyTasks.filter(task => task.assignedToId === member.id);
    
    // Count completed tasks for this week
    const completedTasks = assignedTasks.filter(task => task.status === 'Completed').length;
    
    // Calculate completion rate for this week
    const completionRate = assignedTasks.length > 0
      ? Math.round((completedTasks / assignedTasks.length) * 100)
      : 0;
    
    // Track projects this member is involved in this week
    const memberProjectIds = new Set<string>();
    assignedTasks.forEach(task => {
      if (task.projectId) {
        memberProjectIds.add(task.projectId);
      }
    });
    
    // Convert Set to Array for convenient access
    const projectIdsArray = Array.from(memberProjectIds);
    
    return {
      ...member,
      assignedTasks,
      completedTasks,
      totalTasks: assignedTasks.length,
      completionRate,
      dueTodayTasks: 0, // Not relevant for weekly view
      projects: projectIdsArray.length,
      projectIds: projectIdsArray,
    };
  });
};
