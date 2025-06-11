
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateUserOrganization } from '@/utils/organizationHelpers';

export const updateTaskStatus = async (
  taskId: string,
  status: Task['status'],
  user: { id: string, name?: string, organization_id?: string },
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
    if (!validateUserOrganization(user)) {
      return;
    }
    
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      console.error('Task not found');
      return;
    }

    const now = new Date();
    
    // If completing the task, add who completed it
    let completedById = undefined;
    let completedByName = undefined;
    
    if (status === 'Completed') {
      completedById = user.id;
      completedByName = user.name || task.assignedToName || 'User';
    }

    const { error } = await supabase
      .from('tasks')
      .update({
        status: status,
        completed_at: status === 'Completed' ? now.toISOString() : null,
        completed_by_id: completedById,
      })
      .eq('id', taskId)
      .eq('organization_id', user.organization_id);

    if (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      return;
    }

    // Update tasks in local state
    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { 
          ...t, 
          status: status, 
          completedAt: status === 'Completed' ? now : undefined,
          completedById: status === 'Completed' ? user.id : undefined,
          completedByName: status === 'Completed' ? (user.name || t.assignedToName || 'User') : undefined
        } : t
      )
    );

    // Update tasks in projects
    setProjects((prevProjects) =>
      prevProjects.map((project) => ({
        ...project,
        tasks: project.tasks.map((t) =>
          t.id === taskId ? { 
            ...t, 
            status: status, 
            completedAt: status === 'Completed' ? now : undefined,
            completedById: status === 'Completed' ? user.id : undefined,
            completedByName: status === 'Completed' ? (user.name || t.assignedToName || 'User') : undefined
          } : t
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
        const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
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
