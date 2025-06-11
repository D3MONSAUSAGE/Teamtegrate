import { Project } from '@/types';

export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  // Mock implementation - replace with actual API call
  const newProject: Project = {
    id: Date.now().toString(),
    title: projectData.title,
    description: projectData.description,
    status: projectData.status,
    startDate: projectData.startDate,
    endDate: projectData.endDate,
    managerId: projectData.managerId,
    teamMemberIds: projectData.teamMemberIds || [],
    budget: projectData.budget,
    budgetSpent: 0,
    isCompleted: false,
    tags: projectData.tags || [],
    tasksCount: 0,
    organizationId: projectData.organizationId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return newProject;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<Project> => {
  // Mock implementation - replace with actual API call
  const updatedProject: Project = {
    id: projectId,
    title: updates.title || '',
    description: updates.description,
    status: updates.status || 'To Do',
    startDate: updates.startDate || new Date(),
    endDate: updates.endDate || new Date(),
    managerId: updates.managerId || '',
    teamMemberIds: updates.teamMemberIds || [],
    budget: updates.budget,
    budgetSpent: updates.budgetSpent || 0,
    isCompleted: updates.isCompleted || false,
    tags: updates.tags || [],
    tasksCount: updates.tasksCount || 0,
    organizationId: updates.organizationId || '',
    createdAt: updates.createdAt || new Date(),
    updatedAt: new Date()
  };

  return updatedProject;
};
