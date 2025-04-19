
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { User, Project, Task, TaskStatus, DailyScore } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { updateTaskInProjects } from '../utils';

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const updatedFields: any = {
      updated_at: now.toISOString()
    };

    if (updates.title !== undefined) updatedFields.title = updates.title;
    if (updates.description !== undefined) updatedFields.description = updates.description;
    if (updates.deadline !== undefined) updatedFields.deadline = (updates.deadline instanceof Date ? updates.deadline : new Date(updates.deadline)).toISOString();
    if (updates.priority !== undefined) updatedFields.priority = updates.priority;
    if (updates.status !== undefined) updatedFields.status = updates.status;
    if (updates.projectId !== undefined) updatedFields.project_id = updates.projectId;
    if (updates.assignedToId !== undefined) updatedFields.assigned_to_id = updates.assignedToId;
    if (updates.cost !== undefined) updatedFields.cost = updates.cost;

    const { error } = await supabase
      .from('tasks')
      .update(updatedFields)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      playErrorSound();
      toast.error('Failed to update task');
      return;
    }

    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates, updatedAt: now };
      }
      return task;
    }));

    if (updates) {
      updateTaskInProjects(projects, setProjects, taskId, updates);
    }

    toast.success('Task updated successfully!');
  } catch (error) {
    console.error('Error in updateTask:', error);
    playErrorSound();
    toast.error('Failed to update task');
  }
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setDailyScore: React.Dispatch<React.SetStateAction<DailyScore>>
) => {
  try {
    if (!user) return;

    const now = new Date();

    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: now.toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      playErrorSound();
      toast.error('Failed to update task status');
      return;
    }

    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    ));
    
    playSuccessSound();
    toast.success('Task status updated successfully!');
  } catch (error) {
    console.error('Error updating task status:', error);
    playErrorSound();
    toast.error('Failed to update task status');
  }
};
