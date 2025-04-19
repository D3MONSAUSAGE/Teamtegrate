
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { User, Project, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const deleteTask = async (
  taskId: string,
  user: User | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

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

    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    toast.success('Task deleted successfully!');
  } catch (error) {
    console.error('Error in deleteTask:', error);
    playErrorSound();
    toast.error('Failed to delete task');
  }
};
