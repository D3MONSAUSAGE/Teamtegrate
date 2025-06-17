
import { Project } from '@/types';
import { fixProjectProperties } from '@/utils/typeCompatibility';

export const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  // Mock implementation - replace with actual API call
  const newProject: Project = {
    id: Date.now().toString(),
    title: projectData.title,
    description: projectData.description,
    status: projectData.status,
    startDate: projectData.startDate || new Date().toISOString().split('T')[0],
    endDate: projectData.endDate || new Date().toISOString().split('T')[0],
    managerId: projectData.managerId,
    teamMemberIds: projectData.teamMemberIds || [],
    budget: projectData.budget,
    budgetSpent: 0,
    tasksCount: 0,
    isCompleted: false,
    tags: projectData.tags || [],
    organizationId: projectData.organizationId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return fixProjectProperties(newProject);
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<Project> => {
  // Mock implementation - replace with actual API call
  const updatedProject: Project = {
    id: projectId,
    title: updates.title || '',
    description: updates.description,
    status: updates.status || 'To Do',
    startDate: updates.startDate || new Date().toISOString().split('T')[0],
    endDate: updates.endDate || new Date().toISOString().split('T')[0],
    managerId: updates.managerId || '',
    teamMemberIds: updates.teamMemberIds || [],
    budget: updates.budget || 0,
    budgetSpent: updates.budgetSpent || 0,
    tasksCount: updates.tasksCount || 0,
    isCompleted: updates.isCompleted || false,
    tags: updates.tags || [],
    organizationId: updates.organizationId || '',
    createdAt: updates.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return fixProjectProperties(updatedProject);
};
