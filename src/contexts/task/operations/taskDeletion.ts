
import { User, Project, Task } from '@/types';
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

    console.log(`Attempting to delete task: ${taskId}`);

    // First, try to delete from the tasks table
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (tasksError) {
      console.error('Error deleting from tasks table:', tasksError);
    }

    // Also try to delete from project_tasks table in case it exists there
    const { error: projectTasksError } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId);

    if (projectTasksError) {
      console.error('Error deleting from project_tasks table:', projectTasksError);
    }

    // If both operations failed, show error
    if (tasksError && projectTasksError) {
      console.error('Failed to delete task from both tables');
      playErrorSound();
      toast.error('Failed to delete task');
      return;
    }

    console.log(`Task ${taskId} deleted successfully from database`);

    // Update local state - remove from tasks array
    setTasks(prevTasks => {
      const filteredTasks = prevTasks.filter(task => task.id !== taskId);
      console.log(`Removed task from local tasks. Before: ${prevTasks.length}, After: ${filteredTasks.length}`);
      return filteredTasks;
    });
    
    // Update local state - remove from projects
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(project => {
        const originalTaskCount = project.tasks.length;
        const updatedTasks = project.tasks.filter(task => task.id !== taskId);
        
        if (originalTaskCount !== updatedTasks.length) {
          console.log(`Removed task from project ${project.id}. Tasks: ${originalTaskCount} -> ${updatedTasks.length}`);
        }
        
        return {
          ...project,
          tasks: updatedTasks
        };
      });
      
      return updatedProjects;
    });

    toast.success('Task deleted successfully!');
  } catch (error) {
    console.error('Error in deleteTask:', error);
    playErrorSound();
    toast.error('Failed to delete task');
  }
};
