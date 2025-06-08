
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

interface ManagerPerformance {
  id: string;
  name: string;
  email: string;
  role: string;
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

  // Calculate manager's performance (tasks they created/own)
  const managerPerformance: ManagerPerformance | null = useMemo(() => {
    if (!user) return null;

    console.log('Calculating manager performance with', tasks.length, 'total tasks');
    
    // Manager's tasks are those where user_id matches (tasks they created/own)
    const managerTasks = tasks.filter(task => {
      const taskUserId = task.userId?.toString();
      const userIdStr = user.id.toString();
      const isManagerTask = taskUserId === userIdStr;
      
      if (isManagerTask) {
        console.log(`Task "${task.title}" belongs to manager`);
      }
      
      return isManagerTask;
    });
    
    console.log(`Manager has ${managerTasks.length} tasks`);
    
    const completedTasks = managerTasks.filter(task => task.status === 'Completed');
    
    const completionRate = managerTasks.length > 0
      ? Math.round((completedTasks.length / managerTasks.length) * 100)
      : 0;
    
    // Tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueTodayTasks = managerTasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    // Get projects this manager is involved in
    const managerProjects = projects.filter(project => 
      project.managerId === user.id
    );
    
    return {
      id: user.id,
      name: user.name || 'Manager',
      email: user.email || '',
      role: 'Manager',
      assignedTasks: managerTasks,
      completedTasks: completedTasks.length,
      totalTasks: managerTasks.length,
      completionRate,
      dueTodayTasks: dueTodayTasks.length,
      projects: managerProjects.length,
    };
  }, [user, tasks, projects, lastTaskUpdate]);
  
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

  // Calculate unassigned/orphaned tasks
  const unassignedTasks = useMemo(() => {
    if (!user) return [];
    
    const teamMemberIds = teamMembers.map(m => m.id.toString());
    const managerId = user.id.toString();
    
    return tasks.filter(task => {
      const taskAssignedId = task.assignedToId?.toString();
      const taskUserId = task.userId?.toString();
      
      // Task is unassigned if:
      // 1. Has assigned_to_id but it's not in team or manager
      // 2. Has no assigned_to_id and user_id is not manager
      const isAssignedToNonTeamMember = taskAssignedId && 
        !teamMemberIds.includes(taskAssignedId) && 
        taskAssignedId !== managerId;
      
      const isOrphanedTask = !taskAssignedId && taskUserId !== managerId;
      
      return isAssignedToNonTeamMember || isOrphanedTask;
    });
  }, [tasks, teamMembers, user]);
  
  // Generate data specifically for the performance bar chart
  const memberPerformanceChartData = useMemo(() => {
    const chartData = teamMembersPerformance.map(member => ({
      name: member.name,
      assignedTasks: member.totalTasks,
      completedTasks: member.completedTasks,
      completionRate: member.completionRate
    }));

    // Include manager in chart data
    if (managerPerformance) {
      chartData.unshift({
        name: `${managerPerformance.name} (Manager)`,
        assignedTasks: managerPerformance.totalTasks,
        completedTasks: managerPerformance.completedTasks,
        completionRate: managerPerformance.completionRate
      });
    }

    return chartData;
  }, [teamMembersPerformance, managerPerformance]);
  
  // Calculate summary statistics with memoization (include manager's tasks)
  const summaryStats = useMemo(() => {
    const teamTasksAssigned = teamMembersPerformance.reduce(
      (sum, member) => sum + member.totalTasks, 0
    );
    
    const teamTasksCompleted = teamMembersPerformance.reduce(
      (sum, member) => sum + member.completedTasks, 0
    );

    // Include manager's tasks in totals
    const managerTasksAssigned = managerPerformance?.totalTasks || 0;
    const managerTasksCompleted = managerPerformance?.completedTasks || 0;

    const totalTasksAssigned = teamTasksAssigned + managerTasksAssigned;
    const totalTasksCompleted = teamTasksCompleted + managerTasksCompleted;

    console.log('Summary stats:', { 
      teamTasksAssigned, 
      teamTasksCompleted, 
      managerTasksAssigned, 
      managerTasksCompleted,
      totalTasksAssigned, 
      totalTasksCompleted,
      unassignedCount: unassignedTasks.length
    });

    return {
      totalTasksAssigned,
      totalTasksCompleted,
      teamTasksAssigned,
      teamTasksCompleted,
      managerTasksAssigned,
      managerTasksCompleted,
      unassignedTasksCount: unassignedTasks.length
    };
  }, [teamMembersPerformance, managerPerformance, unassignedTasks]);
  
  return {
    teamMembers,
    teamMembersPerformance,
    managerPerformance,
    memberPerformanceChartData,
    unassignedTasks,
    isLoading,
    removeTeamMember,
    refreshTeamMembers,
    totalTasksAssigned: summaryStats.totalTasksAssigned,
    totalTasksCompleted: summaryStats.totalTasksCompleted,
    teamTasksAssigned: summaryStats.teamTasksAssigned,
    teamTasksCompleted: summaryStats.teamTasksCompleted,
    managerTasksAssigned: summaryStats.managerTasksAssigned,
    managerTasksCompleted: summaryStats.managerTasksCompleted,
    unassignedTasksCount: summaryStats.unassignedTasksCount,
    teamMembersCount: teamMembers.length,
    projectsCount: projects.length,
  };
};

export default useTeamMembers;
