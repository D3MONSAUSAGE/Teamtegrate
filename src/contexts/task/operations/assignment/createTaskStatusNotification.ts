
import { supabase } from '@/integrations/supabase/client';

/**
 * Create notification for task status changes
 */
export const createTaskStatusChangeNotification = async (
  taskId: string,
  taskTitle: string,
  oldStatus: string,
  newStatus: string,
  changedById: string,
  organizationId: string
): Promise<void> => {
  try {
    // Get task assignees to notify
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('assigned_to_id, assigned_to_ids, user_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('Error fetching task for status notification:', taskError);
      return;
    }

    // Collect all users to notify (assignees and creator, but not the person who made the change)
    const usersToNotify = new Set<string>();
    
    if (task.assigned_to_id && task.assigned_to_id !== changedById) {
      usersToNotify.add(task.assigned_to_id);
    }
    
    if (task.assigned_to_ids && Array.isArray(task.assigned_to_ids)) {
      task.assigned_to_ids.forEach((userId: string) => {
        if (userId && userId !== changedById) {
          usersToNotify.add(userId);
        }
      });
    }
    
    if (task.user_id && task.user_id !== changedById) {
      usersToNotify.add(task.user_id);
    }

    if (usersToNotify.size === 0) {
      return;
    }

    // Get changer's name
    const { data: changedByUser } = await supabase
      .from('users')
      .select('name')
      .eq('id', changedById)
      .single();

    const changerName = changedByUser?.name || 'Someone';
    
    // Create notifications
    const notifications = Array.from(usersToNotify).map(userId => ({
      user_id: userId,
      title: 'Task Status Updated',
      content: `${changerName} changed "${taskTitle}" from ${oldStatus} to ${newStatus}`,
      type: 'task_status_change',
      organization_id: organizationId,
      task_id: taskId,
      metadata: {
        route: '/dashboard/tasks'
      }
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating task status change notifications:', error);
    } else {
      console.log(`Created ${notifications.length} task status change notifications`);
    }
  } catch (error) {
    console.error('Error in createTaskStatusChangeNotification:', error);
  }
};

/**
 * Create notification for approaching task deadlines
 */
export const createTaskDeadlineReminderNotification = async (
  taskId: string,
  taskTitle: string,
  deadline: Date,
  userId: string,
  organizationId: string
): Promise<void> => {
  try {
    const timeUntilDeadline = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60));
    const timeText = timeUntilDeadline <= 24 ? `in ${timeUntilDeadline} hours` : 'soon';
    
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Task Deadline Reminder',
      content: `Task "${taskTitle}" is due ${timeText}`,
      type: 'task_deadline_reminder',
      organization_id: organizationId,
      task_id: taskId,
      metadata: {
        route: '/dashboard/tasks'
      }
    });
    
    console.log('Task deadline reminder notification created for user:', userId);
  } catch (error) {
    console.error('Error sending task deadline reminder notification:', error);
  }
};
