
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { organizationId: string }): Promise<Task> => {
  try {
    console.log('Creating task with data:', taskData);
    
    if (!taskData.organizationId) {
      throw new Error('Organization ID is required to create tasks');
    }
    
    const now = new Date();
    const taskId = uuidv4();

    const deadlineIso = taskData.deadline instanceof Date 
      ? taskData.deadline.toISOString() 
      : new Date(taskData.deadline).toISOString();

    // Normalize assignment data for consistent storage
    let assignmentData = {};
    
    if (taskData.assignedToIds && taskData.assignedToIds.length > 0) {
      // We have multi-assignment data
      const isSingleAssignment = taskData.assignedToIds.length === 1;
      
      assignmentData = {
        assigned_to_ids: taskData.assignedToIds,
        assigned_to_names: taskData.assignedToNames || [],
        // For single assignment, also populate single field for backward compatibility
        assigned_to_id: isSingleAssignment ? taskData.assignedToIds[0] : null,
      };
    } else if (taskData.assignedToId) {
      // Legacy single assignment - normalize to both formats
      assignmentData = {
        assigned_to_id: taskData.assignedToId,
        assigned_to_ids: [taskData.assignedToId],
        assigned_to_names: taskData.assignedToName ? [taskData.assignedToName] : [],
      };
    } else {
      // No assignment
      assignmentData = {
        assigned_to_id: null,
        assigned_to_ids: [],
        assigned_to_names: [],
      };
    }
    
    const insertData = {
      id: taskId,
      user_id: taskData.userId,
      project_id: taskData.projectId || null,
      title: taskData.title,
      description: taskData.description,
      deadline: deadlineIso,
      priority: taskData.priority,
      status: taskData.status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      cost: taskData.cost || 0,
      organization_id: taskData.organizationId,
      ...assignmentData,
    };

    console.log('Inserting task with normalized assignment data:', insertData);

    const { data, error } = await supabase
      .from('tasks')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    console.log('Task created successfully:', data);

    // Transform database response to Task type
    const newTask: Task = {
      id: data.id,
      userId: data.user_id,
      projectId: data.project_id,
      title: data.title,
      description: data.description || '',
      deadline: new Date(data.deadline),
      priority: data.priority as 'Low' | 'Medium' | 'High',
      status: data.status as 'To Do' | 'In Progress' | 'Completed',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      assignedToId: data.assigned_to_id || undefined,
      assignedToName: data.assigned_to_names?.[0] || undefined,
      assignedToIds: data.assigned_to_ids || [],
      assignedToNames: data.assigned_to_names || [],
      tags: [],
      comments: [],
      cost: Number(data.cost) || 0,
      organizationId: data.organization_id
    };

    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};
