
import { Project, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playErrorSound } from '@/utils/sounds';

export const deleteProject = async (
  projectId: string,
  user: User | null,
  tasks: any[],
  setTasks: React.Dispatch<React.SetStateAction<any[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

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
    setTasks(prevTasks => prevTasks.filter(task => task.projectId !== projectId));

    toast.success('Project deleted successfully!');
  } catch (error) {
    console.error('Error in deleteProject:', error);
    playErrorSound();
    toast.error('Failed to delete project');
  }
};
