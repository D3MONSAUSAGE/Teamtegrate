
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
    
    // Ensure taskId is a string
    const normalizedTaskId = String(taskId);
    
    // Find user's name if not provided or get updated name
    let actualUserName = userName;
    if ((!actualUserName || actualUserName === userId) && userId) {
      console.log('Fetching user info for:', userId);
      const fetchedName = await fetchUserInfo(userId);
      if (fetchedName) {
        actualUserName = fetchedName;
        console.log('Resolved user name:', actualUserName);
      }
    }

    console.log(`Assigning task ${normalizedTaskId} to user ${userId} (${actualUserName})`);

    // Prepare update payload
    const updatePayload = { 
      assigned_to_id: userId,
      assigned_to_name: actualUserName,
      updated_at: now.toISOString() 
    };

    // First try the tasks table
    let dbError = null;
    let updateSuccessful = false;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', normalizedTaskId);
      
      if (!error) {
        updateSuccessful = true;
        console.log('Successfully updated tasks table with assignment');
      } else {
        dbError = error;
        console.error('Error updating tasks table:', error);
      }
    } catch (err) {
      console.error('Error updating tasks table:', err);
    }
    
    // If that failed, try the project_tasks table
    if (!updateSuccessful) {
      try {
        const { error } = await supabase
          .from('project_tasks')
          .update(updatePayload)
          .eq('id', normalizedTaskId);
        
        if (error) {
          console.error('Error updating project_tasks table:', error);
          if (dbError) {
            console.error('Previous error from tasks table:', dbError);
          }
          playErrorSound();
          toast.error('Failed to assign task to user');
          return;
        } else {
          console.log('Successfully updated project_tasks table with assignment');
          updateSuccessful = true;
        }
      } catch (err) {
        console.error('Error updating project_tasks table:', err);
        playErrorSound();
        toast.error('Failed to assign task to user');
        return;
      }
    }

    // Find the task to send in notification
    const task = tasks.find(t => String(t.id) === normalizedTaskId);
    if (!task) {
      console.error('Task not found:', normalizedTaskId);
      return;
    }

    // Create notification for the assigned user
    if (userId) {
      const isSelfAssigned = (userId === user.id);
      await createTaskAssignmentNotification(userId, task.title, isSelfAssigned);
    }
    
    // Update the state in both tasks array and projects array
    updateTaskStates(
      normalizedTaskId, 
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
