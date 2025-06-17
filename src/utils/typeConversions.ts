
import { Task, Project } from '@/types';
import { FlatTask, FlatProject } from '@/types/flat';

export const flatTasksToTasks = (flatTasks: FlatTask[]): Task[] => {
  return flatTasks.map(flatTask => ({
    id: flatTask.id,
    userId: flatTask.userId,
    projectId: flatTask.projectId,
    title: flatTask.title,
    description: flatTask.description || '',
    deadline: flatTask.deadline,
    priority: flatTask.priority as Task['priority'],
    status: flatTask.status as Task['status'],
    createdAt: flatTask.createdAt,
    updatedAt: flatTask.updatedAt,
    assignedToId: flatTask.assignedToId,
    assignedToName: flatTask.assignedToName,
    assignedToIds: flatTask.assignedToIds,
    assignedToNames: flatTask.assignedToNames,
    cost: flatTask.cost,
    organizationId: flatTask.organizationId
  }));
};

export const flatProjectsToProjects = (flatProjects: FlatProject[]): Project[] => {
  return flatProjects.map(flatProject => ({
    id: flatProject.id,
    title: flatProject.title,
    description: flatProject.description,
    startDate: flatProject.createdAt,
    endDate: flatProject.updatedAt,
    managerId: flatProject.managerId,
    createdAt: flatProject.createdAt,
    updatedAt: flatProject.updatedAt,
    teamMemberIds: [],
    budget: 0,
    budgetSpent: 0,
    isCompleted: false,
    status: flatProject.status as Project['status'],
    tasksCount: 0,
    tags: [],
    organizationId: flatProject.organizationId
  }));
};
