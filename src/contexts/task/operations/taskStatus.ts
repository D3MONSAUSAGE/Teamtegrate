
import { Task, User, TaskStatus, DailyScore, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playStatusChangeSound, playErrorSound } from '@/utils/sounds';

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setDailyScore: React.Dispatch<React.SetStateAction<DailyScore>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const updatedFields: any = {
      status,
      updated_at: now.toISOString()
    };
    
    // If completing the task, set completed_at
    if (status === 'Completed') {
      updatedFields.completed_at = now.toISOString();
    } else {
      // If changing from completed to something else, clear completed_at
      updatedFields.completed_at = null;
    }

    const { error } = await supabase
      .from('tasks')
      .update(updatedFields)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      playErrorSound();
      toast.error('Failed to update task status');
      return;
    }

    // Find the task
    const task = tasks.find(t => t.id === taskId);
    const projectId = task?.projectId;
    
    // Update local tasks state
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { 
          ...task, 
          status, 
          updatedAt: now,
          completedAt: status === 'Completed' ? now : undefined
        };
      }
      return task;
    }));

    // Also update the task in the project
    if (projectId) {
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.map(projectTask => {
                if (projectTask.id === taskId) {
                  return {
                    ...projectTask,
                    status,
                    updatedAt: now,
                    completedAt: status === 'Completed' ? now : undefined
                  };
                }
                return projectTask;
              })
            };
          }
          return project;
        });
      });
    }

    playStatusChangeSound();
    toast.success('Task status updated successfully!');
  } catch (error) {
    console.error('Error updating task status:', error);
    playErrorSound();
    toast.error('Failed to update task status');
  }
};
