import { Task, Project, TaskComment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { createTaskAssignmentNotification, createMultipleTaskAssignmentNotifications } from '../operations/assignment/createNotification';

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

export const createTask = async (task: any, createdBy?: string): Promise<Task> => {
  const now = new Date();
  const taskId = crypto.randomUUID();
  
  // Validate and sanitize UUID fields - convert empty strings to null
  const sanitizeUUID = (value: any): string | null => {
    if (!value || value === '' || value === 'undefined') return null;
    return value;
  };
  
  const sanitizeUUIDArray = (arr: any[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(id => id && id !== '' && id !== 'undefined');
  };
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      id: taskId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status || 'To Do',
      deadline: task.deadline ? task.deadline.toISOString() : null,
      user_id: sanitizeUUID(task.userId),
      project_id: sanitizeUUID(task.projectId),
      assigned_to_id: sanitizeUUID(task.assignedToId),
      assigned_to_ids: sanitizeUUIDArray(task.assignedToIds || []),
      assigned_to_names: task.assignedToNames || [],
      cost: task.cost || 0,
      organization_id: task.organizationId,
      is_recurring: task.is_recurring || false,
      recurrence_pattern: task.recurrence_pattern || null,
      next_due_date: task.next_due_date ? task.next_due_date.toISOString() : (task.deadline ? task.deadline.toISOString() : null),
      recurrence_end_date: task.recurrence_end_date ? (task.recurrence_end_date instanceof Date ? task.recurrence_end_date.toISOString() : task.recurrence_end_date) : null,
      recurrence_parent_id: task.recurrence_parent_id || null,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  
  const newTask: Task = {
    id: data.id,
    title: data.title,
    description: data.description,
    priority: data.priority as Task['priority'],
    status: data.status as Task['status'],
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

  // Send notifications for task assignments if createdBy is provided
  if (createdBy && task.organizationId) {
    await sendAPITaskCreationNotifications(newTask, createdBy, task.organizationId);
  }

  return newTask;
};

export const updateTask = async (taskId: string, updates: any): Promise<void> => {
  // Validate and sanitize UUID fields - convert empty strings to null
  const sanitizeUUID = (value: any): string | null => {
    if (!value || value === '' || value === 'undefined') return null;
    return value;
  };
  
  const sanitizeUUIDArray = (arr: any[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(id => id && id !== '' && id !== 'undefined');
  };
  
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
  if (updates.assignedToId !== undefined) updateData.assigned_to_id = sanitizeUUID(updates.assignedToId);
  if (updates.assignedToIds !== undefined) updateData.assigned_to_ids = sanitizeUUIDArray(updates.assignedToIds);
  if (updates.assignedToNames !== undefined) updateData.assigned_to_names = updates.assignedToNames;
  if (updates.cost !== undefined) updateData.cost = updates.cost;
  if (updates.is_recurring !== undefined) updateData.is_recurring = updates.is_recurring;
  if (updates.recurrence_pattern !== undefined) updateData.recurrence_pattern = updates.recurrence_pattern;
  if (updates.next_due_date !== undefined) updateData.next_due_date = updates.next_due_date ? new Date(updates.next_due_date).toISOString() : null;
  if (updates.recurrence_end_date !== undefined) updateData.recurrence_end_date = updates.recurrence_end_date ? new Date(updates.recurrence_end_date).toISOString() : null;
  if (updates.recurrence_parent_id !== undefined) updateData.recurrence_parent_id = updates.recurrence_parent_id;
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

export const assignTaskToUser = async (taskId: string, userId: string, userName: string): Promise<void> => {
  // Validate and sanitize UUID fields
  const sanitizeUUID = (value: any): string | null => {
    if (!value || value === '' || value === 'undefined') return null;
    return value;
  };
  
  const { error } = await supabase
    .from('tasks')
    .update({
      assigned_to_id: sanitizeUUID(userId),
      assigned_to_ids: userId && userId !== '' ? [userId] : [],
      assigned_to_names: userName && userName !== '' ? [userName] : [],
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
      status: 'To Do' as Project['status'],
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

export const fetchTeamMemberPerformance = async (userId: string): Promise<any> => {
  // Mock implementation for now
  return null;
};

/**
 * Send notifications for newly created tasks via API with assignments
 */
const sendAPITaskCreationNotifications = async (task: Task, creatorId: string, organizationId: string): Promise<void> => {
  try {
    console.log('📬 sendAPITaskCreationNotifications: Checking for assignments in task:', task.id);
    
    // Check if task has any assignments
    const hasAssignments = task.assignedToId || (task.assignedToIds && task.assignedToIds.length > 0);
    
    if (!hasAssignments) {
      console.log('📬 No assignments found, skipping notifications');
      return;
    }

    // Handle single assignment
    if (task.assignedToId && task.assignedToId !== creatorId) {
      console.log('📬 Sending notification for single assignment to:', task.assignedToId);
      
      // Get creator details for email notification
      const { data: creatorData } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', creatorId)
        .single();
      
      if (creatorData) {
        const actor = {
          id: creatorData.id,
          email: creatorData.email,
          name: creatorData.name
        };
        
        await createTaskAssignmentNotification(
          task.assignedToId,
          task.title,
          false, // Not self-assigned since creator is different
          organizationId,
          actor
        );
      }
    }

    // Handle multiple assignments
    if (task.assignedToIds && task.assignedToIds.length > 0) {
      // Filter out the creator from notifications to avoid self-notification
      const assignedUsers = task.assignedToIds.filter(userId => userId !== creatorId);
      
      if (assignedUsers.length > 0) {
        console.log('📬 Sending notifications for multiple assignments to:', assignedUsers);
        await createMultipleTaskAssignmentNotifications(
          assignedUsers,
          task.title,
          creatorId,
          organizationId
        );
      }
    }

    console.log('✅ API task creation notifications sent successfully');
  } catch (error) {
    console.error('❌ Failed to send API task creation notifications:', error);
    // Don't throw error - task creation was successful, notification failure shouldn't block it
  }
};
