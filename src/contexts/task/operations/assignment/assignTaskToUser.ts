
import { Task, User, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { fetchUserInfo } from './fetchUserInfo';
import { createTaskAssignmentNotification } from './createNotification';
import { updateTaskStates } from './updateTaskStates';

/**
 * Assign a task to a specific user
 */
export const assignTaskToUser = async (
  taskId: string,
  userId: string,
  userName: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user || !user.organization_id) return;

    const now = new Date();
    
    // Find user's name if not provided or get updated name
    let actualUserName = userName;
    if ((!actualUserName || actualUserName === userId) && userId) {
      actualUserName = await fetchUserInfo(userId) || userName;
    }

    // Only send assigned_to_id to the database
    const { error } = await supabase
      .from('tasks')
      .update({ 
        assigned_to_id: userId,
        updated_at: now.toISOString() 
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error assigning task to user:', error);
      playErrorSound();
      toast.error('Failed to assign task to user');
      return;
    }

    // Find the task to send in notification
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }

    // Create notification for the assigned user
    if (userId) {
      const isSelfAssigned = (userId === user.id);
      await createTaskAssignmentNotification(userId, task.title, isSelfAssigned, user.organization_id);
    }
    
    // Update the state in both tasks array and projects array
    updateTaskStates(
      taskId, 
      userId, 
      actualUserName, 
      task.projectId, 
      tasks, 
      setTasks, 
      setProjects
    );

    toast.success('Task assigned to user successfully!');
    playSuccessSound();
  } catch (error) {
    console.error('Error in assignTaskToUser:', error);
    playErrorSound();
    toast.error('Failed to assign task to user');
  }
};
