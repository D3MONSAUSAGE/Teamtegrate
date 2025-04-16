
import { useState, useEffect } from 'react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';

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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load team members from localStorage on hook initialization
  useEffect(() => {
    const loadTeamMembers = () => {
      setIsLoading(true);
      const storedMembers = localStorage.getItem('teamMembers');
      if (storedMembers) {
        setTeamMembers(JSON.parse(storedMembers));
      }
      setIsLoading(false);
    };
    
    loadTeamMembers();
  }, []);
  
  // Function to remove a team member
  const removeTeamMember = (memberId: string) => {
    const updatedMembers = teamMembers.filter(member => member.id !== memberId);
    localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
    setTeamMembers(updatedMembers);
    toast.success('Team member removed successfully');
  };
  
  // Function to refresh team members list
  const refreshTeamMembers = () => {
    const storedMembers = localStorage.getItem('teamMembers');
    if (storedMembers) {
      setTeamMembers(JSON.parse(storedMembers));
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
    removeTeamMember,
    refreshTeamMembers,
    totalTasksAssigned,
    totalTasksCompleted,
    teamMembersCount: teamMembers.length,
    projectsCount: projects.length,
  };
};

export default useTeamMembers;
