
import { supabase } from '@/integrations/supabase/client';

/**
 * Create a notification for task assignment
 */
export const createTaskAssignmentNotification = async (
  userId: string,
  taskTitle: string,
  isSelfAssigned: boolean
): Promise<void> => {
  try {
    const notificationType = isSelfAssigned ? 'Task Self-Assigned' : 'Task Assigned';
    const notificationContent = isSelfAssigned 
      ? `You assigned yourself to task: ${taskTitle}` 
      : `You've been assigned to task: ${taskTitle}`;
    
    await supabase.from('notifications').insert({
      user_id: userId,
      title: notificationType,
      content: notificationContent,
      type: 'task_assignment'
    });
    
    console.log(`${isSelfAssigned ? 'Self-assignment' : 'Task assignment'} notification created for user:`, userId);
  } catch (error) {
    console.error(`Error sending ${isSelfAssigned ? 'self-assignment' : 'task assignment'} notification:`, error);
    // Don't block the task assignment if notification fails
  }
};
