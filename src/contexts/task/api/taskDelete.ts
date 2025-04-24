
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export const deleteTask = async (
  taskId: string,
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return;
    }

    setTasks(tasks.filter((task) => task.id !== taskId));

    setProjects((prevProjects) =>
      prevProjects.map((project) => ({
        ...project,
        tasks: project.tasks.filter((task) => task.id !== taskId),
      }))
    );

    toast.success('Task deleted successfully!');
  } catch (error) {
    console.error('Error deleting task:', error);
    toast.error('Failed to delete task');
  }
};
