
import { Task, TaskComment } from '@/types';
import { FlatTask, FlatProject } from '@/types/flat';
import { Project } from '@/types';

// Convert FlatTask to Task
export const flatTaskToTask = (flatTask: FlatTask): Task => {
  return {
    id: flatTask.id,
    userId: flatTask.userId,
    projectId: flatTask.projectId,
    title: flatTask.title,
    description: flatTask.description,
    deadline: flatTask.deadline,
    priority: flatTask.priority,
    status: flatTask.status,
    createdAt: flatTask.createdAt,
    updatedAt: flatTask.updatedAt,
    assignedToId: flatTask.assignedToId,
    assignedToName: flatTask.assignedToName,
    assignedToIds: flatTask.assignedToIds,
    assignedToNames: flatTask.assignedToNames,
    comments: [] as TaskComment[], // Initialize empty comments
    cost: flatTask.cost,
    organizationId: flatTask.organizationId,
  };
};

// Convert Project to FlatProject (for compatibility with components expecting FlatProject)
export const projectToFlatProject = (project: Project): FlatProject => {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    startDate: project.startDate,
    endDate: project.endDate,
    managerId: project.managerId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    teamMemberIds: project.teamMembers || [], // Convert teamMembers to teamMemberIds
    budget: project.budget,
    budgetSpent: project.budgetSpent || 0,
    is_completed: project.is_completed,
    status: project.status,
    tasks_count: project.tasks_count,
    tags: project.tags || [],
    organizationId: project.organizationId || '',
  };
};

// Convert FlatProject to Project (for compatibility with legacy components)
export const flatProjectToProject = (flatProject: FlatProject, tasks: FlatTask[] = []): Project => {
  const projectTasks = tasks.filter(task => task.projectId === flatProject.id);
  
  return {
    id: flatProject.id,
    title: flatProject.title,
    description: flatProject.description,
    startDate: flatProject.startDate,
    endDate: flatProject.endDate,
    managerId: flatProject.managerId,
    createdAt: flatProject.createdAt,
    updatedAt: flatProject.updatedAt,
    tasks: projectTasks.map(flatTaskToTask),
    teamMembers: flatProject.teamMemberIds, // Convert teamMemberIds to teamMembers
    budget: flatProject.budget,
    budgetSpent: flatProject.budgetSpent,
    is_completed: flatProject.is_completed,
    status: flatProject.status,
    tasks_count: flatProject.tasks_count,
    tags: flatProject.tags,
    organizationId: flatProject.organizationId,
  };
};

// Convert array of FlatTasks to Tasks
export const flatTasksToTasks = (flatTasks: FlatTask[]): Task[] => {
  return flatTasks.map(flatTaskToTask);
};

// Convert array of FlatProjects to Projects
export const flatProjectsToProjects = (flatProjects: FlatProject[], tasks: FlatTask[] = []): Project[] => {
  return flatProjects.map(flatProject => flatProjectToProject(flatProject, tasks));
};
