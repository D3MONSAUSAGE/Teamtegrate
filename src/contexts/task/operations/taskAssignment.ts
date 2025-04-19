
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { User, Project, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { updateTaskInProjects } from '../utils';

export const assignTaskToProject = async (
  taskId: string,
  projectId: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();

    const { error } = await supabase
      .from('tasks')
      .update({ project_id: projectId, updated_at: now.toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error assigning task to project:', error);
      playErrorSound();
      toast.error('Failed to assign task to project');
      return;
    }

    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, projectId, updatedAt: now };
      }
      return task;
    }));

    toast.success('Task assigned to project successfully!');
  } catch (error) {
    console.error('Error in assignTaskToProject:', error);
    playErrorSound();
    toast.error('Failed to assign task to project');
  }
};

export const assignTaskToUser = async (
  taskId: string,
  userId: string,
  userName: string,
  currentUser: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!currentUser) return;
    
    const { error } = await supabase
      .from('tasks')
      .update({ 
        assigned_to_id: userId
      })
      .eq('id', taskId);
    
    if (error) {
      console.error('Error assigning task to user:', error);
      toast.error('Failed to assign task');
      return;
    }
    
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? 
          {
            ...task,
            assignedToId: userId,
            assignedToName: userName
          } :
          task
      )
    );
    
    updateTaskInProjects(
      projects, 
      setProjects, 
      taskId, 
      { assignedToId: userId, assignedToName: userName }
    );
    
    toast.success(`Task assigned to ${userName}`);
  } catch (error) {
    console.error('Error in assignTaskToUser:', error);
  }
};
