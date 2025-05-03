
import { useState, useEffect } from 'react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  managerId: string;
}

interface TeamMemberPerformance extends TeamMember {
  assignedTasks: Task[];
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  dueTodayTasks: number;
  projects: number;
  projectIds: string[]; // Added to store actual project IDs
}

const useTeamMembers = () => {
  const { tasks, projects } = useTask();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load team members from Supabase on hook initialization
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('manager_id', user.id);

        if (error) {
          throw error;
        }

        // Transform the data to match our TeamMember interface
        const formattedMembers: TeamMember[] = data.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          managerId: member.manager_id
        }));

        setTeamMembers(formattedMembers);
      } catch (error) {
        console.error('Error loading team members:', error);
        toast.error('Failed to load team members');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTeamMembers();
  }, [user]);
  
  // Function to remove a team member
  const removeTeamMember = async (memberId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('manager_id', user.id);

      if (error) {
        throw error;
      }

      setTeamMembers((prev) => prev.filter((member) => member.id !== memberId));
      toast.success('Team member removed successfully');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  };
  
  // Function to refresh team members list
  const refreshTeamMembers = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('manager_id', user.id);

      if (error) {
        throw error;
      }

      // Transform the data to match our TeamMember interface
      const formattedMembers: TeamMember[] = data.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        managerId: member.manager_id
      }));

      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Error refreshing team members:', error);
      toast.error('Failed to refresh team members');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate completion rates and assigned tasks for each member
  const teamMembersPerformance: TeamMemberPerformance[] = teamMembers.map((member) => {
    // Get all tasks assigned to this team member
    const assignedTasks = tasks.filter(task => task.assignedToId === member.id);
    
    // Count completed tasks
    const completedTasks = assignedTasks.filter(task => task.status === 'Completed');
    
    // Calculate completion rate
    const completionRate = assignedTasks.length > 0
      ? Math.round((completedTasks.length / assignedTasks.length) * 100)
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
    // This now stores actual project IDs for reference
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
      completedTasks: completedTasks.length,
      totalTasks: assignedTasks.length,
      completionRate,
      dueTodayTasks: dueTodayTasks.length,
      projects: projectIdsArray.length,
      projectIds: projectIdsArray,
    };
  });
  
  // Generate data specifically for the performance bar chart
  const memberPerformanceChartData = teamMembersPerformance.map(member => ({
    name: member.name,
    assignedTasks: member.totalTasks,
    completedTasks: member.completedTasks.length || 0,
    completionRate: member.completionRate
  }));
  
  // Calculate summary statistics
  const totalTasksAssigned = teamMembersPerformance.reduce(
    (sum, member) => sum + member.totalTasks, 0
  );
  
  const totalTasksCompleted = teamMembersPerformance.reduce(
    (sum, member) => sum + member.completedTasks, 0
  );
  
  return {
    teamMembers,
    teamMembersPerformance,
    memberPerformanceChartData,
    isLoading,
    removeTeamMember,
    refreshTeamMembers,
    totalTasksAssigned,
    totalTasksCompleted,
    teamMembersCount: teamMembers.length,
    projectsCount: projects.length,
  };
};

export default useTeamMembers;
