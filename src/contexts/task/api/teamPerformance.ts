
import { supabase } from '@/integrations/supabase/client';
import { TeamMemberPerformance } from '@/types';
import { fetchUserInfo } from '../operations/assignment/fetchUserInfo';
import { toast } from '@/components/ui/sonner';

/**
 * Fetch performance metrics for all team members
 * @returns An array of team member performance data
 */
export const fetchTeamPerformance = async (): Promise<TeamMemberPerformance[]> => {
  try {
    console.log('Fetching team performance data');
    
    // Get all team members who have been assigned tasks
    const { data: taskAssignments, error: assignmentsError } = await supabase
      .from('project_tasks')
      .select('assigned_to_id')
      .not('assigned_to_id', 'is', null);
      
    if (assignmentsError) {
      console.error('Error fetching task assignments:', assignmentsError);
      return [];
    }

    // Extract unique user IDs
    const userIds = [...new Set(taskAssignments.map(t => t.assigned_to_id))].filter(Boolean);
    
    if (userIds.length === 0) {
      console.log('No team members with assigned tasks found');
      return [];
    }
    
    console.log(`Found ${userIds.length} team members with assigned tasks`);
    
    // Build performance metrics for each team member
    const performanceData: TeamMemberPerformance[] = [];
    
    for (const userId of userIds) {
      // Get user name
      const userName = await fetchUserInfo(userId);
      
      // If user info can't be found, skip this user
      if (!userName) continue;
      
      // Get tasks assigned to this user
      const { data: userTasks, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('assigned_to_id', userId);
        
      if (tasksError) {
        console.error(`Error fetching tasks for user ${userId}:`, tasksError);
        continue;
      }
      
      // Count total and completed tasks
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(task => task.status === 'Completed').length;
      
      // Calculate completion rate
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Get projects this user is involved in
      const { data: projectsData, error: projectsError } = await supabase
        .from('project_team_members')
        .select('project_id')
        .eq('user_id', userId);
        
      if (projectsError) {
        console.error(`Error fetching projects for user ${userId}:`, projectsError);
        continue;
      }
      
      // Count unique projects
      const projects = new Set(projectsData.map(p => p.project_id)).size;
      
      // Add to performance data
      performanceData.push({
        id: userId,
        name: userName,
        totalTasks,
        completedTasks,
        completionRate,
        projects
      });
    }
    
    // Sort by completion rate (highest first)
    return performanceData.sort((a, b) => b.completionRate - a.completionRate);
  } catch (error) {
    console.error('Error in fetchTeamPerformance:', error);
    toast.error('Failed to load team performance data');
    return [];
  }
};

/**
 * Get performance data for a specific team member
 * @param userId The ID of the user to get performance data for
 * @returns Performance metrics for the specified user
 */
export const fetchTeamMemberPerformance = async (userId: string): Promise<TeamMemberPerformance | null> => {
  try {
    if (!userId) return null;
    
    // Get user name
    const userName = await fetchUserInfo(userId);
    
    // If user info can't be found, return null
    if (!userName) return null;
    
    // Get tasks assigned to this user
    const { data: userTasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('assigned_to_id', userId);
      
    if (tasksError) {
      console.error(`Error fetching tasks for user ${userId}:`, tasksError);
      return null;
    }
    
    // Count total and completed tasks
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(task => task.status === 'Completed').length;
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Get projects this user is involved in
    const { data: projectsData, error: projectsError } = await supabase
      .from('project_team_members')
      .select('project_id')
      .eq('user_id', userId);
      
    if (projectsError) {
      console.error(`Error fetching projects for user ${userId}:`, projectsError);
      return null;
    }
    
    // Count unique projects
    const projects = new Set(projectsData.map(p => p.project_id)).size;
    
    // Return performance data
    return {
      id: userId,
      name: userName,
      totalTasks,
      completedTasks,
      completionRate,
      projects
    };
  } catch (error) {
    console.error('Error in fetchTeamMemberPerformance:', error);
    toast.error('Failed to load team member performance data');
    return null;
  }
};
