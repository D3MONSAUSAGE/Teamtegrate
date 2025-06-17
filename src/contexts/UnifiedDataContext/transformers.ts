
import { Task, Project, User } from '@/types';

// Transform database task to app Task type
export const transformDbTaskToAppTask = (dbTask: any, user?: { id?: string; organizationId?: string }): Task => {
  return {
    id: String(dbTask.id || ''),
    userId: String(dbTask.user_id || user?.id || ''),
    projectId: dbTask.project_id ? String(dbTask.project_id) : undefined,
    title: String(dbTask.title || ''),
    description: String(dbTask.description || ''),
    deadline: new Date(dbTask.deadline || new Date()),
    priority: (['Low', 'Medium', 'High'].includes(dbTask.priority) ? dbTask.priority : 'Medium') as 'Low' | 'Medium' | 'High',
    status: (['To Do', 'In Progress', 'Completed'].includes(dbTask.status) ? dbTask.status : 'To Do') as 'To Do' | 'In Progress' | 'Completed',
    createdAt: new Date(dbTask.created_at || new Date()),
    updatedAt: new Date(dbTask.updated_at || new Date()),
    assignedToId: dbTask.assigned_to_id ? String(dbTask.assigned_to_id) : undefined,
    assignedToName: dbTask.assigned_to_names?.[0] || undefined,
    assignedToIds: dbTask.assigned_to_ids || [],
    assignedToNames: dbTask.assigned_to_names || [],
    tags: [],
    comments: [],
    cost: Number(dbTask.cost) || 0,
    organizationId: String(dbTask.organization_id || user?.organizationId || '')
  };
};

// Transform database project to app Project type
export const transformDbProjectToAppProject = (dbProject: any, user?: { organizationId?: string }): Project => {
  return {
    id: String(dbProject.id || ''),
    title: String(dbProject.title || ''),
    description: String(dbProject.description || ''),
    startDate: dbProject.start_date ? String(dbProject.start_date) : new Date().toISOString().split('T')[0],
    endDate: dbProject.end_date ? String(dbProject.end_date) : new Date().toISOString().split('T')[0],
    status: (['To Do', 'In Progress', 'Completed'].includes(dbProject.status) ? dbProject.status : 'To Do') as 'To Do' | 'In Progress' | 'Completed',
    budget: Number(dbProject.budget) || 0,
    budgetSpent: Number(dbProject.budget_spent) || 0,
    managerId: String(dbProject.manager_id || ''),
    teamMemberIds: dbProject.team_members || [],
    tags: dbProject.tags || [],
    createdAt: dbProject.created_at ? String(dbProject.created_at) : new Date().toISOString(),
    updatedAt: dbProject.updated_at ? String(dbProject.updated_at) : new Date().toISOString(),
    isCompleted: Boolean(dbProject.is_completed) || false,
    organizationId: String(dbProject.organization_id || user?.organizationId || ''),
    tasksCount: Number(dbProject.tasks_count) || 0
  };
};

// Transform database user to app User type
export const transformDbUserToAppUser = (dbUser: any): User => {
  return {
    id: String(dbUser.id || ''),
    email: String(dbUser.email || ''),
    role: dbUser.role as User['role'],
    organizationId: String(dbUser.organization_id || ''),
    name: String(dbUser.name || ''),
    timezone: String(dbUser.timezone || 'UTC'),
    createdAt: new Date(dbUser.created_at || new Date()),
    avatar_url: dbUser.avatar_url || undefined
  };
};
