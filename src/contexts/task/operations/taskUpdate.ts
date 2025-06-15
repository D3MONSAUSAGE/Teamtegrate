
import { Task, TaskStatus } from '@/types';
import { SimpleUser } from '@/types/simplified';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { sanitizeTaskAssignment, validateTaskAssignment } from '@/utils/taskValidation';

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  user: SimpleUser,
  setTasks: (tasks: Task[]) => void,
  tasks: Task[]
): Promise<void> => {
  try {
    console.log('updateTask: Starting task update with enhanced validation for task:', taskId);
    
    if (!user?.organization_id) {
      throw new Error('User must belong to an organization to update tasks');
    }

    // Validate assignment data if being updated
    if (updates.assignedToId !== undefined || updates.assignedToIds !== undefined) {
      if (!validateTaskAssignment(updates.assignedToId, updates.assignedToIds)) {
        throw new Error('Invalid task assignment: empty strings not allowed in UUID fields');
      }
    }

    // Prepare update data with proper UUID validation
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline.toISOString();
    if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
    if (updates.cost !== undefined) updateData.cost = updates.cost;
    
    // Handle assignment fields with sanitization
    if (updates.assignedToId !== undefined) updateData.assigned_to_id = updates.assignedToId;
    if (updates.assignedToIds !== undefined) updateData.assigned_to_ids = updates.assignedToIds;
    if (updates.assignedToNames !== undefined) updateData.assigned_to_names = updates.assignedToNames;

    // Sanitize assignment data
    const sanitizedData = sanitizeTaskAssignment(updateData);
    sanitizedData.updated_at = new Date().toISOString();

    console.log('updateTask: Sanitized update data:', sanitizedData);

    // Update task with enhanced validation
    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(sanitizedData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('updateTask: Database error:', error);
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

    if (!updatedTask) {
      throw new Error('Failed to update task - no data returned');
    }

    console.log('updateTask: Successfully updated task:', updatedTask.id);

    // Update local state
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? {
            ...task,
            title: updatedTask.title,
            description: updatedTask.description || '',
            priority: (updatedTask.priority as 'Low' | 'Medium' | 'High') || 'Medium',
            status: (updatedTask.status as 'To Do' | 'In Progress' | 'Completed') || 'To Do',
            deadline: new Date(updatedTask.deadline || updatedTask.updated_at),
            projectId: updatedTask.project_id,
            assignedToId: updatedTask.assigned_to_id || undefined,
            assignedToName: updatedTask.assigned_to_names?.[0] || undefined,
            assignedToIds: updatedTask.assigned_to_ids || [],
            assignedToNames: updatedTask.assigned_to_names || [],
            cost: Number(updatedTask.cost) || 0,
            updatedAt: new Date(updatedTask.updated_at)
          }
        : task
    );
    
    setTasks(updatedTasks);
    toast.success('Task updated successfully');
    
  } catch (error: any) {
    console.error('updateTask: Error updating task:', error);
    
    // Enhanced error messages for UUID validation issues
    if (error.message?.includes('invalid input syntax for type uuid')) {
      toast.error('Invalid user assignment. Please ensure all selected users are valid.');
    } else if (error.message?.includes('check_assigned_to_id_not_empty')) {
      toast.error('Task assignment cannot be empty. Please select a valid user or leave unassigned.');
    } else if (error.message?.includes('check_assigned_to_ids_no_empty')) {
      toast.error('Task assignments cannot contain empty values. Please select valid users only.');
    } else {
      toast.error(`Failed to update task: ${error.message}`);
    }
    
    throw error;
  }
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  user: SimpleUser,
  setTasks: (tasks: Task[]) => void,
  tasks: Task[]
): Promise<void> => {
  console.log('updateTaskStatus: Updating task status with enhanced validation:', taskId, status);
  
  const updates: Partial<Task> = { status };
  
  // Set completion timestamp when marking as completed
  if (status === 'Completed') {
    updates.updatedAt = new Date();
  }
  
  await updateTask(taskId, updates, user, setTasks, tasks);
};
