
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
    if (!user) return;

    const now = new Date();
    
    // Find user's name if not provided or get updated name
    let actualUserName = userName;
    if ((!actualUserName || actualUserName === userId) && userId) {
      console.log('Fetching user info for assignment, userId:', userId);
      const fetchedName = await fetchUserInfo(userId);
      if (fetchedName) {
        actualUserName = fetchedName;
        console.log('Got user name from DB:', actualUserName);
      }
    }

    console.log('Assigning task to user:', {
      taskId,
      userId,
      userName: actualUserName
    });

    // Try project_tasks table first
    let projectTableError = null;
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ 
          assigned_to_id: userId,
          updated_at: now.toISOString() 
        })
        .eq('id', taskId);
      
      projectTableError = error;
      if (error) {
        console.error('Error assigning task in project_tasks:', error);
      } else {
        console.log('Successfully updated assignment in project_tasks');
      }
    } catch (error) {
      console.error('Exception when updating project_tasks:', error);
      projectTableError = error;
    }

    // Fall back to legacy tasks table if needed
    if (projectTableError) {
      console.log('Falling back to legacy tasks table for assignment');
      const { error } = await supabase
        .from('tasks')
        .update({ 
          assigned_to_id: userId,
          updated_at: now.toISOString() 
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error assigning task to user in legacy table:', error);
        playErrorSound();
        toast.error('Failed to assign task to user');
        return;
      }
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
      await createTaskAssignmentNotification(userId, task.title, isSelfAssigned);
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
