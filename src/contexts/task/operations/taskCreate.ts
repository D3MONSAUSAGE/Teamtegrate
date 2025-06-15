
import { Task } from '@/types';
import { SimpleUser } from '@/types/simplified';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { sanitizeTaskAssignment, validateTaskAssignment } from '@/utils/taskValidation';

export const createTask = async (
  taskData: Partial<Task>,
  user: SimpleUser,
  setTasks: (tasks: Task[]) => void,
  tasks: Task[]
): Promise<void> => {
  try {
    console.log('createTask: Starting task creation with enhanced validation');
    
    if (!user?.organization_id) {
      throw new Error('User must belong to an organization to create tasks');
    }

    // Validate assignment data before processing
    if (!validateTaskAssignment(taskData.assignedToId, taskData.assignedToIds)) {
      throw new Error('Invalid task assignment: empty strings not allowed in UUID fields');
    }

    // Prepare task data with proper UUID validation
    const sanitizedData = sanitizeTaskAssignment({
      id: taskData.id || crypto.randomUUID(),
      user_id: user.id,
      organization_id: user.organization_id,
      title: taskData.title || '',
      description: taskData.description || '',
      priority: taskData.priority || 'Medium',
      status: taskData.status || 'To Do',
      deadline: taskData.deadline ? taskData.deadline.toISOString() : new Date().toISOString(),
      project_id: taskData.projectId || null,
      assigned_to_id: taskData.assignedToId,
      assigned_to_ids: taskData.assignedToIds,
      assigned_to_names: taskData.assignedToNames,
      cost: taskData.cost || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log('createTask: Sanitized task data:', sanitizedData);

    // Insert task with enhanced validation
    const { data: insertedTask, error } = await supabase
      .from('tasks')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) {
      console.error('createTask: Database error:', error);
      if (error.message.includes('invalid input syntax for type uuid')) {
        throw new Error('Invalid user assignment. Please ensure all selected users are valid.');
      }
      if (error.message.includes('check_assigned_to_id_not_empty')) {
        throw new Error('Task assignment cannot be empty. Please select a valid user or leave unassigned.');
      }
      if (error.message.includes('check_assigned_to_ids_no_empty')) {
        throw new Error('Task assignments cannot contain empty values. Please select valid users only.');
      }
      throw error;
    }

    if (!insertedTask) {
      throw new Error('Failed to create task - no data returned');
    }

    console.log('createTask: Successfully created task:', insertedTask.id);

    // Transform database task to Task type with proper handling
    const newTask: Task = {
      id: insertedTask.id,
      userId: insertedTask.user_id,
      projectId: insertedTask.project_id,
      title: insertedTask.title,
      description: insertedTask.description || '',
      deadline: new Date(insertedTask.deadline || insertedTask.created_at),
      priority: (insertedTask.priority as 'Low' | 'Medium' | 'High') || 'Medium',
      status: (insertedTask.status as 'To Do' | 'In Progress' | 'Completed') || 'To Do',
      createdAt: new Date(insertedTask.created_at),
      updatedAt: new Date(insertedTask.updated_at),
      assignedToId: insertedTask.assigned_to_id || undefined,
      assignedToName: insertedTask.assigned_to_names?.[0] || undefined,
      assignedToIds: insertedTask.assigned_to_ids || [],
      assignedToNames: insertedTask.assigned_to_names || [],
      tags: [],
      comments: [],
      cost: Number(insertedTask.cost) || 0,
      organizationId: insertedTask.organization_id
    };

    // Update local state
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);

    toast.success('Task created successfully');
    
  } catch (error: any) {
    console.error('createTask: Error creating task:', error);
    
    // Enhanced error messages for UUID validation issues
    if (error.message?.includes('invalid input syntax for type uuid')) {
      toast.error('Invalid user assignment. Please ensure all selected users are valid.');
    } else if (error.message?.includes('check_assigned_to_id_not_empty')) {
      toast.error('Task assignment cannot be empty. Please select a valid user or leave unassigned.');
    } else if (error.message?.includes('check_assigned_to_ids_no_empty')) {
      toast.error('Task assignments cannot contain empty values. Please select valid users only.');
    } else {
      toast.error(`Failed to create task: ${error.message}`);
    }
    
    throw error;
  }
};
