
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
  userId: string | undefined,
  userName: string | undefined,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;
    
    // Handle task unassignment case
    const isUnassigning = !userId;
    
    const now = new Date();
    
    // If unassigning, set name to undefined as well
    if (isUnassigning) {
      userName = undefined;
    }
    // Find user's name if not provided or get updated name
    else if ((!userName || userName === userId) && userId) {
      console.log('Fetching user info for assignment, userId:', userId);
      try {
        const fetchedName = await fetchUserInfo(userId);
        if (fetchedName) {
          userName = fetchedName;
          console.log('Got user name from DB:', userName);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    }

    console.log('Assigning task to user:', {
      taskId,
      userId: userId || 'unassigned',
      userName: userName || 'unassigned'
    });

    // Validate UUID format before sending to database
    const isValidUuid = (id: string) => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidPattern.test(id);
    };

    if (userId && !isValidUuid(userId)) {
      console.error('Invalid UUID format for user ID:', userId);
      playErrorSound();
      toast.error('Invalid user ID format');
      return;
    }
    
    // Format the task update data correctly
    const updateData = { 
      assigned_to_id: userId || null,
      updated_at: now.toISOString() 
    };

    // Try project_tasks table first
    let projectTableError = null;
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update(updateData)
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
        .update(updateData)
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
      try {
        await createTaskAssignmentNotification(userId, task.title, isSelfAssigned);
      } catch (error) {
        console.error('Error creating task assignment notification:', error);
      }
    }
    
    // Update the state in both tasks array and projects array
    updateTaskStates(
      taskId, 
      userId, 
      userName, 
      task.projectId, 
      tasks, 
      setTasks, 
      setProjects
    );

    if (isUnassigning) {
      toast.success('Task unassigned successfully');
    } else {
      toast.success('Task assigned to user successfully!');
    }
    playSuccessSound();
  } catch (error) {
    console.error('Error in assignTaskToUser:', error);
    playErrorSound();
    toast.error('Failed to assign task to user');
  }
};
