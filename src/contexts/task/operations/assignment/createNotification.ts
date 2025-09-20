
import { supabase } from '@/integrations/supabase/client';
import { notifications } from '@/lib/notifications';

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

    // Also send email notification (don't block if it fails)
    try {
      // Get task details for email
      const { data: taskData } = await supabase
        .from('tasks')
        .select(`
          id, title, description, status, priority, deadline, created_at, organization_id,
          projects (title)
        `)
        .eq('title', taskTitle)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get user details
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', userId)
        .single();

      if (taskData && userData) {
        const taskNotification = {
          id: taskData.id,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          deadline: taskData.deadline,
          created_at: taskData.created_at,
          organization_id: taskData.organization_id,
          project_title: (taskData.projects as any)?.title
        };

        const assignee = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email
        };

        await notifications.notifyTaskAssigned(taskNotification, [assignee], assignee);
      }
    } catch (emailError) {
      console.log('Email notification failed, but task assignment succeeded:', emailError);
    }
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
