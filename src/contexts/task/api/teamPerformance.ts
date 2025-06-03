
import { TeamMemberPerformance } from '@/types';

export const fetchTeamPerformance = async (): Promise<TeamMemberPerformance[]> => {
  // Mock data for team performance
  return [
    {
      id: '1',
      name: 'John Doe',
      completedTasks: 15,
      completionRate: 85,
      projects: 3
    },
    {
      id: '2', 
      name: 'Jane Smith',
      completedTasks: 12,
      completionRate: 90,
      projects: 2
    }
  ];
};

export const fetchTeamMemberPerformance = async (userId: string): Promise<TeamMemberPerformance | null> => {
  // Mock data for individual team member performance
  return {
    id: userId,
    name: 'Team Member',
    completedTasks: 10,
    completionRate: 80,
    projects: 2
  };
};
