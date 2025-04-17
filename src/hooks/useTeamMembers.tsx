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
}

const useTeamMembers = () => {
  const { tasks, projects } = useTask();
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load team members from Supabase on hook initialization
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching team members for manager ID:", user.id);
        
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('manager_id', user.id);

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("Team members data received:", data);

        // Transform the data to match our TeamMember interface
        const formattedMembers: TeamMember[] = (data || []).map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          managerId: member.manager_id
        }));

        setTeamMembers(formattedMembers);
      } catch (error: any) {
        console.error('Error loading team members:', error);
        setError(error.message || 'Failed to load team members');
        // Still set teamMembers to empty array to avoid showing loading forever
        setTeamMembers([]);
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
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('manager_id', user.id);

      if (error) {
        throw error;
      }

      // Transform the data to match our TeamMember interface
      const formattedMembers: TeamMember[] = (data || []).map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        managerId: member.manager_id
      }));

      setTeamMembers(formattedMembers);
    } catch (error: any) {
      console.error('Error refreshing team members:', error);
      setError(error.message || 'Failed to refresh team members');
      setTeamMembers([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate completion rates and assigned tasks for each member
  const teamMembersPerformance: TeamMemberPerformance[] = teamMembers.map((member) => {
    const assignedTasks = tasks.filter(task => task.assignedToId === member.id);
    
    const completedTasks = assignedTasks.filter(task => task.status === 'Completed');
    
    const completionRate = assignedTasks.length > 0
      ? Math.round((completedTasks.length / assignedTasks.length) * 100)
      : 0;
    
    // Tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueTodayTasks = assignedTasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    // Get projects this member is involved in
    const memberProjects = projects.filter(project => 
      project.tasks.some(task => task.assignedToId === member.id)
    );
    
    return {
      ...member,
      assignedTasks,
      completedTasks: completedTasks.length,
      totalTasks: assignedTasks.length,
      completionRate,
      dueTodayTasks: dueTodayTasks.length,
      projects: memberProjects.length,
    };
  });
  
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
    isLoading,
    error,
    removeTeamMember,
    refreshTeamMembers,
    totalTasksAssigned,
    totalTasksCompleted,
    teamMembersCount: teamMembers.length,
    projectsCount: projects.length,
  };
};

export default useTeamMembers;
