
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    const updatedTask = {
      ...tasks.find((task) => task.id === taskId),
      ...updates,
      updatedAt: new Date(),
    };

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: updatedTask.title,
        description: updatedTask.description,
        deadline: updatedTask.deadline.toISOString(),
        priority: updatedTask.priority,
        status: updatedTask.status,
        updated_at: updatedTask.updatedAt.toISOString(),
        assigned_to_id: updatedTask.assignedToId,
        assigned_to_name: updatedTask.assignedToName,
        cost: updatedTask.cost || 0,
      })
      .eq('id', taskId)
      .select();

    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return;
    }

    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );

    if (updatedTask.projectId) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === updatedTask.projectId
            ? {
                ...project,
                tasks: project.tasks.map((task) =>
                  task.id === taskId ? { ...task, ...updates } : task
                ),
              }
            : project
        )
      );
    }

    toast.success('Task updated successfully!');
  } catch (error) {
    console.error('Error updating task:', error);
    toast.error('Failed to update task');
  }
};
