
import { supabase } from '@/integrations/supabase/client';
import { notifications } from '@/lib/notifications';

/**
 * Create a notification for task assignment
 */
export const createTaskAssignmentNotification = async (
  userId: string,
  taskTitle: string,
  isSelfAssigned: boolean,
  organizationId: string,
  actor?: { id: string; email: string; name?: string | null }
): Promise<void> => {
  try {
    const notificationType = isSelfAssigned ? 'Task Self-Assigned' : 'Task Assigned';
    const notificationContent = isSelfAssigned 
      ? `You assigned yourself to task: ${taskTitle}` 
      : `You've been assigned to task: ${taskTitle}`;
    
    // Create notification with push for the assignee
    await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title: notificationType,
        content: notificationContent,
        type: 'task_assigned',
        metadata: {
          route: '/dashboard/tasks'
        },
        organization_id: organizationId,
        send_push: true
      }
    });
    
    console.log(`${isSelfAssigned ? 'Self-assignment' : 'Task assignment'} notification created for user:`, userId);

    // Also send email notification if not self-assigned and actor provided (don't block if it fails)  
    if (!isSelfAssigned && actor) {
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

        const actorForEmail = {
          id: actor.id,
          email: actor.email,
          name: actor.name || actor.email
        };

        await notifications.notifyTaskAssigned(taskNotification, [assignee], actorForEmail);
      }
      } catch (emailError) {
        console.log('Email notification failed, but task assignment succeeded:', emailError);
      }
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
    // Create notifications with push for multiple assignees
    for (const userId of userIds) {
      const notificationType = userId === currentUserId ? 'Task Self-Assigned' : 'Task Assigned';
      const notificationContent = userId === currentUserId 
        ? `You assigned yourself to task: ${taskTitle}`
        : `You've been assigned to task: ${taskTitle}`;

      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: userId,
          title: notificationType,
          content: notificationContent,
          type: 'task_assigned',
          metadata: {
            route: '/dashboard/tasks'
          },
          organization_id: organizationId,
          send_push: true
        }
      });
    }
    
    console.log(`Created ${userIds.length} task assignment notifications for task:`, taskTitle);

    // Also send email notifications for multiple assignees (don't block if it fails)
    try {
      console.log(`[EMAIL] Sending email notifications for ${userIds.length} assignees`);
      
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

      // Get assignee details for all users
      const { data: assigneesData } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', userIds);

      // Get current user details (actor)
      const { data: actorData } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', currentUserId)
        .single();

      if (taskData && assigneesData && assigneesData.length > 0 && actorData) {
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

        const actor = {
          id: actorData.id,
          email: actorData.email,
          name: actorData.name || actorData.email
        };

        // Send email to each assignee
        const emailPromises = assigneesData.map(async (userData) => {
          const assignee = {
            id: userData.id,
            email: userData.email,
            name: userData.name || userData.email
          };

          console.log(`[EMAIL] Sending task assignment email to: ${assignee.email}`);
          return notifications.notifyTaskAssigned(taskNotification, [assignee], actor);
        });

        const emailResults = await Promise.allSettled(emailPromises);
        
        // Log results
        const successful = emailResults.filter(result => result.status === 'fulfilled').length;
        const failed = emailResults.filter(result => result.status === 'rejected').length;
        
        console.log(`[EMAIL] Multiple assignee email results: ${successful} successful, ${failed} failed`);
        
        // Log failed attempts
        emailResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`[EMAIL] Failed to send email to assignee ${index}:`, result.reason);
          }
        });
      } else {
        console.warn('[EMAIL] Missing data for email notifications:', { 
          hasTaskData: !!taskData, 
          assigneeCount: assigneesData?.length || 0,
          hasActorData: !!actorData 
        });
      }
    } catch (emailError) {
      console.error('Multiple assignee email notifications failed, but task assignment succeeded:', emailError);
    }
  } catch (error) {
    console.error('Error sending multiple task assignment notifications:', error);
    // Don't block the task assignment if notification fails
  }
};
