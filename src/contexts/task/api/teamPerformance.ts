
import { TeamMemberPerformance } from '@/types';
import { ensureTeamMemberPerformanceComplete } from '@/utils/typeCompatibility';

export const fetchTeamPerformance = async (organizationId: string = ''): Promise<TeamMemberPerformance[]> => {
  // Mock data for team performance
  const mockData = [
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

  return mockData.map(item => ensureTeamMemberPerformanceComplete(item, organizationId));
};

export const fetchTeamMemberPerformance = async (userId: string, organizationId: string = ''): Promise<TeamMemberPerformance | null> => {
  // Mock data for individual team member performance
  const mockData = {
    id: userId,
    name: 'Team Member',
    completedTasks: 10,
    completionRate: 80,
    projects: 2
  };

  return ensureTeamMemberPerformanceComplete(mockData, organizationId);
};
