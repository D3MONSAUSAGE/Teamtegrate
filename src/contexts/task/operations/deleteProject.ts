
import { User, Project, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

export const deleteProject = async (
  projectId: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) {
      toast.error('You must be logged in to delete a project');
      return;
    }

    const projectTasks = tasks.filter(task => task.projectId === projectId);

    // First update any tasks associated with this project to remove the project reference
    for (const task of projectTasks) {
      const { error } = await supabase
        .from('tasks')
        .update({ project_id: null })
        .eq('id', task.id);

      if (error) {
        console.error('Error updating task:', error);
      }
    }

    // Then delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      playErrorSound();
      toast.error('Failed to delete project');
      return;
    }

    // Update the projects state by filtering out the deleted project
    setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
    
    // Update tasks state to reflect the project removal
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.projectId === projectId) {
        return { ...task, projectId: undefined };
      }
      return task;
    }));

    playSuccessSound();
    toast.success('Project deleted successfully!');
  } catch (error) {
    console.error('Error in deleteProject:', error);
    playErrorSound();
    toast.error('Failed to delete project');
  }
};
