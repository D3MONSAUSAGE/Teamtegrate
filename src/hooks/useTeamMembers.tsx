
import { useState, useEffect, useMemo } from 'react';
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
  const [lastTaskUpdate, setLastTaskUpdate] = useState(Date.now());
  
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

        console.log('Loaded team members:', formattedMembers);
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

  // Subscribe to real-time task updates
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time task subscription');
    
    const channel = supabase
      .channel('task-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Task update received:', payload);
          setLastTaskUpdate(Date.now());
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
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
  
  // Memoized calculation of team member performance with proper type conversion
  const teamMembersPerformance: TeamMemberPerformance[] = useMemo(() => {
    console.log('Calculating team performance with', teamMembers.length, 'members and', tasks.length, 'tasks');
    
    return teamMembers.map((member) => {
      // Fix data type consistency by converting both to strings for comparison
      const memberIdStr = member.id.toString();
      const assignedTasks = tasks.filter(task => {
        const taskAssignedId = task.assignedToId?.toString();
        const isAssigned = taskAssignedId === memberIdStr;
        
        if (isAssigned) {
          console.log(`Task "${task.title}" assigned to member ${member.name}`);
        }
        
        return isAssigned;
      });
      
      console.log(`Member ${member.name} has ${assignedTasks.length} assigned tasks`);
      
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
        project.tasks.some(task => {
          const taskAssignedId = task.assignedToId?.toString();
          return taskAssignedId === memberIdStr;
        })
      );
      
      const performance = {
        ...member,
        assignedTasks,
        completedTasks: completedTasks.length,
        totalTasks: assignedTasks.length,
        completionRate,
        dueTodayTasks: dueTodayTasks.length,
        projects: memberProjects.length,
      };

      console.log(`Performance for ${member.name}:`, {
        totalTasks: performance.totalTasks,
        completedTasks: performance.completedTasks,
        completionRate: performance.completionRate,
        dueTodayTasks: performance.dueTodayTasks,
        projects: performance.projects
      });

      return performance;
    });
  }, [teamMembers, tasks, projects, lastTaskUpdate]);
  
  // Generate data specifically for the performance bar chart
  const memberPerformanceChartData = useMemo(() => {
    return teamMembersPerformance.map(member => ({
      name: member.name,
      assignedTasks: member.totalTasks,
      completedTasks: member.completedTasks,
      completionRate: member.completionRate
    }));
  }, [teamMembersPerformance]);
  
  // Calculate summary statistics with memoization
  const summaryStats = useMemo(() => {
    const totalTasksAssigned = teamMembersPerformance.reduce(
      (sum, member) => sum + member.totalTasks, 0
    );
    
    const totalTasksCompleted = teamMembersPerformance.reduce(
      (sum, member) => sum + member.completedTasks, 0
    );

    console.log('Summary stats:', { totalTasksAssigned, totalTasksCompleted });

    return {
      totalTasksAssigned,
      totalTasksCompleted
    };
  }, [teamMembersPerformance]);
  
  return {
    teamMembers,
    teamMembersPerformance,
    memberPerformanceChartData,
    isLoading,
    removeTeamMember,
    refreshTeamMembers,
    totalTasksAssigned: summaryStats.totalTasksAssigned,
    totalTasksCompleted: summaryStats.totalTasksCompleted,
    teamMembersCount: teamMembers.length,
    projectsCount: projects.length,
  };
};

export default useTeamMembers;
