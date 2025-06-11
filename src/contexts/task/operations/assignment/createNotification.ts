
import { supabase } from '@/integrations/supabase/client';

/**
 * Create a notification for task assignment
 */
export const createTaskAssignmentNotification = async (
  userId: string,
  taskTitle: string,
  isSelfAssigned: boolean,
  organizationId: string
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
      type: 'task_assignment',
      organization_id: organizationId
    });
    
    console.log(`${isSelfAssigned ? 'Self-assignment' : 'Task assignment'} notification created for user:`, userId);
  } catch (error) {
    console.error(`Error sending ${isSelfAssigned ? 'self-assignment' : 'task assignment'} notification:`, error);
    // Don't block the task assignment if notification fails
  }
};

/**
 * Create notifications for multiple task assignments
 */
export const createMultipleTaskAssignmentNotifications = async (
  userIds: string[],
  taskTitle: string,
  currentUserId: string,
  organizationId: string
): Promise<void> => {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title: userId === currentUserId ? 'Task Self-Assigned' : 'Task Assigned',
      content: userId === currentUserId 
        ? `You assigned yourself to task: ${taskTitle}`
        : `You've been assigned to task: ${taskTitle}`,
      type: 'task_assignment',
      organization_id: organizationId
    }));

    await supabase.from('notifications').insert(notifications);
    
    console.log(`Created ${notifications.length} task assignment notifications for task:`, taskTitle);
  } catch (error) {
    console.error('Error sending multiple task assignment notifications:', error);
    // Don't block the task assignment if notification fails
  }
};
