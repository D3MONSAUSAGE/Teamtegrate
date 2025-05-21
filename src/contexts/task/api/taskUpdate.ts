
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
    // Find the existing task to merge with updates
    const existingTask = tasks.find((task) => task.id === taskId);
    if (!existingTask) {
      console.error('Task not found:', taskId);
      toast.error('Failed to update task: Task not found');
      return;
    }

    const now = new Date();
    const updatedTask = {
      ...existingTask,
      ...updates,
      updatedAt: now,
    };

    // Prepare the supabase update payload with snake_case column names
    const updatePayload: Record<string, any> = {
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      status: updatedTask.status,
      updated_at: now.toISOString(),
      assigned_to_id: updatedTask.assignedToId || null,
      assigned_to_name: updatedTask.assignedToName || null,
      cost: updatedTask.cost || 0,
    };
    
    // Only add deadline if it exists and is valid
    if (updatedTask.deadline) {
      const deadlineDate = updatedTask.deadline instanceof Date 
        ? updatedTask.deadline 
        : new Date(updatedTask.deadline);
      
      if (!isNaN(deadlineDate.getTime())) {
        updatePayload.deadline = deadlineDate.toISOString();
      }
    }

    // Send update to Supabase
    const { error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return;
    }

    // Update local state
    setTasks(
      tasks.map((task) => (task.id === taskId ? updatedTask : task))
    );

    // Update project state if task belongs to a project
    if (updatedTask.projectId) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === updatedTask.projectId
            ? {
                ...project,
                tasks: project.tasks.map((task) =>
                  task.id === taskId ? updatedTask : task
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
