
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export const updateTaskStatus = async (
  taskId: string,
  status: Task['status'],
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>,
  setDailyScore: React.Dispatch<React.SetStateAction<{
    completedTasks: number;
    totalTasks: number;
    percentage: number;
    date: Date;
  }>>
): Promise<void> => {
  try {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      console.error('Task not found');
      return;
    }

    const now = new Date();
    const updates: Partial<Task> = {
      status: status,
      completedAt: status === 'Completed' ? now : undefined,
      completedById: status === 'Completed' ? user.id : undefined,
    };

    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: status,
        completed_at: status === 'Completed' ? now.toISOString() : null,
        completed_by_id: status === 'Completed' ? user.id : null,
      })
      .eq('id', taskId)
      .select();

    if (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      return;
    }

    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, status: status, completedAt: now } : t
      )
    );

    setProjects((prevProjects) =>
      prevProjects.map((project) => ({
        ...project,
        tasks: project.tasks.map((task) =>
          task.id === taskId ? { ...task, status: status, completedAt: now } : task
        ),
      }))
    );

    // Update daily score
    setDailyScore((prevScore) => {
      const today = new Date().toDateString();
      if (prevScore.date.toDateString() === today) {
        const completedTasks =
          status === 'Completed'
            ? prevScore.completedTasks + 1
            : prevScore.completedTasks - 1;
        const totalTasks = prevScore.totalTasks;
        const percentage = (completedTasks / totalTasks) * 100;
        return {
          ...prevScore,
          completedTasks,
          percentage,
        };
      }
      return prevScore;
    });

    toast.success('Task status updated successfully!');
  } catch (error) {
    console.error('Error updating task status:', error);
    toast.error('Failed to update task status');
  }
};
