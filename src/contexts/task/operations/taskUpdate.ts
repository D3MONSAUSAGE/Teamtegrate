
import { Task, Project, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const updateTaskStatus = async (
  taskId: string,
  status: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: status as any, updatedAt: new Date() } : task
    ));

    toast.success(`Task status updated to ${status}`);
  } catch (error) {
    console.error('Error updating task status:', error);
    toast.error('Failed to update task status');
  }
};

export const updateTaskAssignment = async (
  taskId: string,
  assigneeId: string,
  assigneeName: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { 
        ...task, 
        assignedToId: assigneeId,
        assignedToName: assigneeName,
        updatedAt: new Date() 
      } : task
    ));

    toast.success('Task assignment updated');
  } catch (error) {
    console.error('Error updating task assignment:', error);
    toast.error('Failed to update task assignment');
  }
};
