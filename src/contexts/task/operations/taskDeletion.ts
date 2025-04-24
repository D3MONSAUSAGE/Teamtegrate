
import { User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playErrorSound } from '@/utils/sounds';

export const deleteTask = async (
  taskId: string,
  user: User | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    // Find the task to get its project ID before deleting
    const taskToDelete = projects.flatMap(p => p.tasks).find(t => t.id === taskId) || 
                         projects.find(p => p.tasks.some(t => t.id === taskId))?.tasks.find(t => t.id === taskId);
    const projectId = taskToDelete?.projectId;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      playErrorSound();
      toast.error('Failed to delete task');
      return;
    }

    // Immediately update state to remove the task
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    // Also remove from project if it belongs to one
    if (projectId) {
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.filter(task => task.id !== taskId)
            };
          }
          return project;
        });
      });
    }

    toast.success('Task deleted successfully!');
  } catch (error) {
    console.error('Error in deleteTask:', error);
    playErrorSound();
    toast.error('Failed to delete task');
  }
};
