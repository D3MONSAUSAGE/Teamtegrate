
import { User, Task, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playErrorSound } from '@/utils/sounds';

export const deleteProject = async (
  projectId: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;
    
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    for (const task of projectTasks) {
      await supabase
        .from('tasks')
        .update({ project_id: null })
        .eq('id', task.id);
    }
    
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
    
    setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
    
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.projectId === projectId) {
        return { ...task, projectId: undefined };
      }
      return task;
    }));
    
    toast.success('Project deleted successfully!');
  } catch (error) {
    console.error('Error in deleteProject:', error);
    playErrorSound();
    toast.error('Failed to delete project');
  }
};
