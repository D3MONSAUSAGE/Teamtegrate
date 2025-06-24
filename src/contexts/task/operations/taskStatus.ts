
import { Task, Project, TaskStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  user: { id?: string; organizationId?: string } | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  console.log('🔧 updateTaskStatus: Starting update', { taskId, status, user });
  
  try {
    if (!user || !user.id || !user.organizationId) {
      console.error('❌ updateTaskStatus: Missing user context', user);
      toast.error('You must be logged in to update task status');
      playErrorSound();
      return;
    }

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
      toast.error(`Failed to update task status: ${error.message}`);
      return;
    }

    console.log('✅ updateTaskStatus: Database update successful');

    // Update local task state
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updatedTask } : task
      )
    );

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
          
          // Update local project state
          setProjects(prevProjects =>
            prevProjects.map(project =>
              project.id === taskData.project_id
                ? {
                    ...project,
                    status: projectStatus as any,
                    isCompleted: isCompleted,
                    updatedAt: new Date().toISOString()
                  }
                : project
            )
          );
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
