
import { Task, Project, TaskComment } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const fetchTasks = async (organizationId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', organizationId);
  
  if (error) throw error;
  
  return (data || []).map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority as Task['priority'],
    status: task.status as Task['status'],
    deadline: task.deadline ? new Date(task.deadline) : new Date(),
    userId: task.user_id,
    projectId: task.project_id,
    assignedToId: task.assigned_to_id,
    assignedToIds: task.assigned_to_ids,
    assignedToNames: task.assigned_to_names,
    cost: task.cost,
    organizationId: task.organization_id,
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at),
    completedAt: task.completed_at ? new Date(task.completed_at) : undefined
  }));
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  const now = new Date();
  const taskId = crypto.randomUUID();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      id: taskId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status || 'To Do',
      deadline: task.deadline ? task.deadline.toISOString() : null,
      user_id: task.userId,
      project_id: task.projectId,
      assigned_to_id: task.assignedToId,
      assigned_to_ids: task.assignedToIds || [],
      assigned_to_names: task.assignedToNames || [],
      cost: task.cost || 0,
      organization_id: task.organizationId,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: data.status,
    deadline: data.deadline ? new Date(data.deadline) : new Date(),
    userId: data.user_id,
    projectId: data.project_id,
    assignedToId: data.assigned_to_id,
    assignedToIds: data.assigned_to_ids,
    assignedToNames: data.assigned_to_names,
    cost: data.cost,
    organizationId: data.organization_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.deadline !== undefined) {
    updateData.deadline = updates.deadline ? updates.deadline.toISOString() : null;
  }
  if (updates.assignedToId !== undefined) updateData.assigned_to_id = updates.assignedToId;
  if (updates.assignedToIds !== undefined) updateData.assigned_to_ids = updates.assignedToIds;
  if (updates.assignedToNames !== undefined) updateData.assigned_to_names = updates.assignedToNames;
  if (updates.cost !== undefined) updateData.cost = updates.cost;

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId);

  if (error) throw error;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
};

export const updateTaskStatus = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const updateData: any = {
    status: updates.status,
    updated_at: new Date().toISOString()
  };

  if (updates.status === 'Completed' && updates.completedAt) {
    updateData.completed_at = updates.completedAt.toISOString();
  }

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId);

  if (error) throw error;
};

export const assignTaskToUser = async (taskId: string, userId: string, userName: string): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .update({
      assigned_to_id: userId,
      assigned_to_ids: [userId],
      assigned_to_names: [userName],
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) throw error;
};

export const fetchProjects = async (organizationId: string): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return (data || []).map(project => ({
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status as Project['status'],
    startDate: project.start_date,
    endDate: project.end_date,
    managerId: project.manager_id,
    teamMemberIds: project.team_members || [],
    budget: project.budget,
    budgetSpent: project.budget_spent,
    tasksCount: project.tasks_count,
    isCompleted: project.is_completed,
    tags: project.tags || [],
    organizationId: project.organization_id,
    createdAt: project.created_at,
    updatedAt: project.updated_at
  }));
};

export const createProject = async (projectData: {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  organizationId: string;
}): Promise<Project> => {
  const now = new Date();
  const projectId = crypto.randomUUID();
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      id: projectId,
      title: projectData.title,
      description: projectData.description,
      start_date: projectData.startDate,
      end_date: projectData.endDate,
      budget: projectData.budget,
      budget_spent: 0,
      is_completed: false,
      status: 'To Do',
      tasks_count: 0,
      team_members: [],
      tags: [],
      organization_id: projectData.organizationId,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    status: data.status as Project['status'],
    startDate: data.start_date,
    endDate: data.end_date,
    managerId: data.manager_id,
    teamMemberIds: data.team_members || [],
    budget: data.budget,
    budgetSpent: data.budget_spent,
    tasksCount: data.tasks_count,
    isCompleted: data.is_completed,
    tags: data.tags || [],
    organizationId: data.organization_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
  if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
  if (updates.budget !== undefined) updateData.budget = updates.budget;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;
  if (updates.teamMemberIds !== undefined) updateData.team_members = updates.teamMemberIds;

  const { error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId);

  if (error) throw error;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
};

export const fetchTeamPerformance = async (): Promise<any[]> => {
  // Mock implementation for now
  return [];
};
