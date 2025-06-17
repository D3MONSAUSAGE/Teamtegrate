
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
  try {
    if (!user) {
      toast.error('You must be logged in to update task status');
      return;
    }

    const updatedTask: Partial<Task> = { 
      status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'Completed') {
      updatedTask.completedAt = new Date().toISOString();
    }

    console.log('Updating task status:', { taskId, status, updatedTask });

    // Prepare data for database update
    const dbUpdateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'Completed') {
      dbUpdateData.completed_at = new Date().toISOString();
    }

    // Update task in database
    const { error } = await supabase
      .from('tasks')
      .update(dbUpdateData)
      .eq('id', taskId)
      .eq('organization_id', user.organizationId);

    if (error) {
      console.error('Error updating task status:', error);
      playErrorSound();
      toast.error('Failed to update task status');
      return;
    }

    // Update local task state
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updatedTask } : task
      )
    );

    // Get the task to check if it belongs to a project
    const { data: taskData } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', taskId)
      .single();

    if (taskData?.project_id) {
      // Update project status based on all its tasks
      const { data: projectTasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', taskData.project_id)
        .eq('organization_id', user.organizationId);

      if (projectTasks) {
        const allCompleted = projectTasks.every(task => task.status === 'Completed');
        const hasInProgress = projectTasks.some(task => task.status === 'In Progress');
        
        let projectStatus = 'To Do';
        let isCompleted = false;
        
        if (allCompleted && projectTasks.length > 0) {
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
          console.error('Error updating project status:', projectError);
        } else {
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

    toast.success('Task status updated successfully!');
    playSuccessSound();
  } catch (error) {
    console.error('Error in updateTaskStatus:', error);
    playErrorSound();
    toast.error('Failed to update task status');
  }
};
