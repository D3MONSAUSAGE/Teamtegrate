import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface NotificationRecipient {
  id: string;
  email: string;
  name?: string;
  push_token?: string;
}

interface TicketNotificationData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  created_at: string;
  organization_id: string;
}

interface UserData {
  id: string;
  email: string;
  name?: string;
}

interface TaskNotificationData {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  deadline?: string;
  created_at: string;
  organization_id: string;
  project_title?: string;
}

// Centralized notification orchestrator - Frontend calls edge functions
export const notifications = {
  // Ticket Created - notify requester (confirmation) + admins (new ticket alert)
  async notifyTicketCreated(ticket: TicketNotificationData, user: UserData) {
    try {
      console.log(`[Notifications] Triggering ticket created notifications: ${ticket.id}`);

      // Call edge function to handle email + push notifications
      const { data, error } = await supabase.functions.invoke('send-ticket-notifications', {
        body: {
          type: 'ticket_created',
          ticket,
          user,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send ticket created notifications:', error);
        throw error;
      }

      console.log('[Notifications] Ticket created notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTicketCreated:', error);
      // Don't throw - notifications should not break the main flow
    }
  },

  // Ticket Assigned - notify new assignee
  async notifyTicketAssigned(ticket: TicketNotificationData, assignee: UserData, actor: UserData) {
    try {
      console.log(`[Notifications] Triggering ticket assigned notifications: ${ticket.id} to ${assignee.id}`);

      const { data, error } = await supabase.functions.invoke('send-ticket-notifications', {
        body: {
          type: 'ticket_assigned',
          ticket,
          assignee,
          actor,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send ticket assigned notifications:', error);
        throw error;
      }

      console.log('[Notifications] Ticket assigned notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTicketAssigned:', error);
    }
  },

  // Status Updated - notify requester and assignee
  async notifyTicketUpdated(ticket: TicketNotificationData, oldStatus: string, newStatus: string, actor: UserData, message?: string) {
    try {
      console.log(`[Notifications] Triggering ticket updated notifications: ${ticket.id} from ${oldStatus} to ${newStatus}`);

      const { data, error } = await supabase.functions.invoke('send-ticket-notifications', {
        body: {
          type: 'ticket_updated',
          ticket,
          oldStatus,
          newStatus,
          actor,
          message,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send ticket updated notifications:', error);
        throw error;
      }

      console.log('[Notifications] Ticket updated notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTicketUpdated:', error);
    }
  },

  // Ticket Closed - notify requester with resolution
  async notifyTicketClosed(ticket: TicketNotificationData, resolution: string, actor: UserData) {
    try {
      console.log(`[Notifications] Triggering ticket closed notifications: ${ticket.id}`);

      const { data, error } = await supabase.functions.invoke('send-ticket-notifications', {
        body: {
          type: 'ticket_closed',
          ticket,
          resolution,
          actor,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send ticket closed notifications:', error);
        throw error;
      }

      console.log('[Notifications] Ticket closed notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTicketClosed:', error);
    }
  },

  // Task Assignment - notify assigned user(s)
  async notifyTaskAssigned(task: TaskNotificationData, assignees: UserData[], actor: UserData) {
    try {
      console.log(`[Notifications] Triggering task assigned notifications: ${task.id} to ${assignees.length} user(s)`);

      // Validate all assignees have email addresses
      const validAssignees = assignees.filter(assignee => {
        if (!assignee.email) {
          console.error('[Notifications] Missing assignee email for:', assignee);
          return false;
        }
        return true;
      });

      if (validAssignees.length === 0) {
        throw new Error('No valid assignees with email addresses');
      }

      // Send notification to each assignee individually and await all
      const notificationPromises = validAssignees.map(async (assignee) => {
        console.log(`[Notifications] Sending task assignment email to: ${assignee.email}`);

        try {
          const { data, error } = await supabase.functions.invoke('send-task-notifications', {
            body: {
              kind: 'task_assigned',
              to: assignee.email,
              task: {
                id: task.id,
                title: task.title,
                description: task.description,
                due_at: task.deadline,
                priority: task.priority
              },
              actor: {
                id: actor.id,
                email: actor.email,
                name: actor.name
              }
            }
          });

          console.log(`[Notifications] Result for ${assignee.email}:`, { to: assignee.email, data, error });
          
          if (error) {
            throw error;
          }
          
          return { to: assignee.email, data, error: null };
        } catch (err) {
          console.error(`[Notifications] Failed to send task assigned notification to ${assignee.email}:`, err);
          return { to: assignee.email, data: null, error: err };
        }
      });

      const results = await Promise.allSettled(notificationPromises);
      
      // Log comprehensive results
      const successful = results.filter(result => result.status === 'fulfilled' && !result.value.error).length;
      const failed = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error)).length;
      
      console.log(`[Notifications] Task assignment email results: ${successful} successful, ${failed} failed out of ${validAssignees.length} total`);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { to, data, error } = result.value;
          console.log(`[Notifications] Email ${index + 1} - to: ${to}, data:`, data, 'error:', error);
        } else {
          console.error(`[Notifications] Email ${index + 1} - Promise rejected:`, result.reason);
        }
      });

    } catch (error) {
      console.error('[Notifications] Error in notifyTaskAssigned:', error);
      throw error;
    }
  },

  // Task Status Changed - notify assigned users
  async notifyTaskStatusChanged(task: TaskNotificationData, oldStatus: string, newStatus: string, actor: UserData, assignees: UserData[]) {
    try {
      console.log(`[Notifications] Triggering task status changed notifications: ${task.id} from ${oldStatus} to ${newStatus}`);

      const { data, error } = await supabase.functions.invoke('send-task-notifications', {
        body: {
          type: 'task_status_changed',
          task,
          oldStatus,
          newStatus,
          actor,
          assignees,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send task status changed notifications:', error);
        throw error;
      }

      console.log('[Notifications] Task status changed notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyTaskStatusChanged:', error);
    }
  },

  
  // Simple success/error notifications for UI feedback
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message)
};