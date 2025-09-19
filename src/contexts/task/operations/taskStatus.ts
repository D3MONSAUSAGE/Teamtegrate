
import { Task, Project, TaskStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  user: { id?: string; organizationId?: string } | null
): Promise<void> => {
  console.log('🔧 updateTaskStatus: Starting update', { taskId, status, user });
  
  try {
    if (!user || !user.id || !user.organizationId) {
      console.error('❌ updateTaskStatus: Missing user context', user);
      toast.error('You must be logged in to update task status');
      playErrorSound();
      throw new Error('Authentication required');
    }

    // Validate task exists and user has access
    console.log('🔍 updateTaskStatus: Validating task access...');
    const { data: taskExists, error: taskCheckError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('organization_id', user.organizationId)
      .single();
    
    if (taskCheckError || !taskExists) {
      console.error('❌ updateTaskStatus: Task access validation failed', taskCheckError);
      toast.error('Task not found or access denied');
      playErrorSound();
      throw new Error('Task not found or access denied');
    }
    
    console.log('✅ updateTaskStatus: Task access validated');

    const updatedTask: Partial<Task> = { 
      status,
      updatedAt: new Date()
    };

    if (status === 'Completed') {
      updatedTask.completedAt = new Date();
    }

    console.log('🔧 updateTaskStatus: Updating task in database', { taskId, status, organizationId: user.organizationId });

    // Prepare data for database update
    const dbUpdateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'Completed') {
      dbUpdateData.completed_at = new Date().toISOString();
    }

    // Update task in database - using correct table name and organization validation
    const { error } = await supabase
      .from('tasks')
      .update(dbUpdateData)
      .eq('id', taskId)
      .eq('organization_id', user.organizationId);

    if (error) {
      console.error('❌ updateTaskStatus: Database error', error);
      playErrorSound();
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to update task status';
      if (error.message.includes('row-level security')) {
        errorMessage = 'Access denied - you may not have permission to update this task';
      } else if (error.message.includes('invalid input syntax')) {
        errorMessage = 'Invalid data format - please try again';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Task not found or no longer exists';
      } else {
        errorMessage = `Failed to update task status: ${error.message}`;
      }
      
      toast.error(errorMessage);
      throw new Error(error.message);
    }

    console.log('✅ updateTaskStatus: Database update successful');

    // If this task is a recurring parent, generate the next occurrence
    if (status === 'Completed') {
      const { data: recTask, error: recErr } = await supabase
        .from('tasks')
        .select('is_recurring')
        .eq('id', taskId)
        .single();
      if (!recErr && recTask?.is_recurring) {
        console.log('🔁 Generating next recurring task occurrence...');
        const { data: genData, error: genErr } = await supabase.rpc('generate_recurring_task_occurrence', {
          parent_task_id: taskId,
          organization_id_param: user.organizationId
        });
        if (genErr) {
          console.error('❌ Failed to generate next recurring occurrence:', genErr);
          toast.error('Failed to create next recurring task occurrence');
        } else if (genData) {
          console.log('✅ Next recurring occurrence generated:', genData);
          toast.success('Next recurring task created successfully');
        } else {
          console.log('ℹ️ Recurring task series ended (reached end date/limit)');
        }
      }
    }


    // Get the task to check if it belongs to a project
    const { data: taskData, error: taskFetchError } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', taskId)
      .single();

    if (taskFetchError) {
      console.warn('⚠️ updateTaskStatus: Could not fetch task project info', taskFetchError);
      // Don't fail the whole operation for this
    } else if (taskData?.project_id) {
      console.log('🔧 updateTaskStatus: Updating project status based on tasks');
      
      // Update project status based on all its tasks - using correct table name
      const { data: projectTasks, error: projectTasksError } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', taskData.project_id)
        .eq('organization_id', user.organizationId);

      if (projectTasksError) {
        console.warn('⚠️ updateTaskStatus: Could not fetch project tasks', projectTasksError);
        // Don't fail the whole operation for this
      } else if (projectTasks && projectTasks.length > 0) {
        const allCompleted = projectTasks.every(task => task.status === 'Completed');
        const hasInProgress = projectTasks.some(task => task.status === 'In Progress');
        
        let projectStatus = 'To Do';
        let isCompleted = false;
        
        if (allCompleted) {
          projectStatus = 'Completed';
          isCompleted = true;
        } else if (hasInProgress || projectTasks.some(task => task.status === 'Completed')) {
          projectStatus = 'In Progress';
        }

        // Update project status in database
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            status: projectStatus,
            is_completed: isCompleted,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskData.project_id)
          .eq('organization_id', user.organizationId);

        if (projectError) {
          console.error('❌ updateTaskStatus: Error updating project status', projectError);
        } else {
          console.log('✅ updateTaskStatus: Project status updated', { projectStatus, isCompleted });
        }
      }
    }

    console.log('✅ updateTaskStatus: Complete success');
    toast.success('Task status updated successfully!');
    playSuccessSound();
    
  } catch (error) {
    console.error('❌ updateTaskStatus: Unexpected error', error);
    playErrorSound();
    toast.error('Failed to update task status');
    throw error; // Re-throw to let calling code handle it
  }
};
