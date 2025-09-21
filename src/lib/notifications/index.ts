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

interface InventoryNotificationData {
  id: string;
  count_date: string;
  status: string;
  organization_id: string;
  team_id?: string;
  template_id?: string;
  template_name?: string;
  team_name?: string;
  conducted_by: string;
  completion_percentage: number;
  variance_count: number;
  total_items_count: number;
  notes?: string;
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

      // Send notification to each assignee individually
      for (const assignee of assignees) {
        if (!assignee.email) {
          console.error('[Notifications] Missing assignee email for:', assignee);
          continue;
        }

        console.log(`[Notifications] Sending task assignment email to: ${assignee.email}`);

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

        if (error) {
          console.error(`[Notifications] Failed to send task assigned notification to ${assignee.email}:`, error);
        } else {
          console.log(`[Notifications] Task assigned notification sent successfully to ${assignee.email}:`, data);
        }
      }
    } catch (error) {
      console.error('[Notifications] Error in notifyTaskAssigned:', error);
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

  // Inventory Template Completed - notify team managers and admins
  async notifyInventoryTemplateCompleted(count: InventoryNotificationData, completedBy: UserData) {
    try {
      console.log(`[Notifications] Triggering inventory template completed notifications: ${count.id}`);

      const { data, error } = await supabase.functions.invoke('send-inventory-notifications', {
        body: {
          type: 'template_completed',
          count,
          completedBy,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('[Notifications] Failed to send inventory template completed notifications:', error);
        throw error;
      }

      console.log('[Notifications] Inventory template completed notifications sent successfully:', data);
    } catch (error) {
      console.error('[Notifications] Error in notifyInventoryTemplateCompleted:', error);
    }
  },

  // Inventory Count Submitted - email notifications to team managers and admins
  async notifyInventorySubmitted(
    inventory: { id: string; team_name?: string; team_id?: string; items_total?: number; submitted_by_name?: string; location_name?: string; },
    recipients: Array<{ email?: string | null }>
  ) {
    try {
      const emails = (recipients ?? [])
        .map(r => r?.email?.trim()?.toLowerCase())
        .filter(Boolean);
      
      if (emails.length === 0) {
        console.warn("[notifyInventorySubmitted] No recipients with email", { recipients });
        return { data: { sent: 0, results: [] }, error: null };
      }

      console.log(`[Notifications] Sending inventory submission emails to ${emails.length} recipients: ${inventory.id}`);

      const { data, error } = await supabase.functions.invoke("send-inventory-notifications", {
        body: { kind: "inventory_count_submitted", recipients: emails, inventory, timestamp: new Date().toISOString() },
      });

      if (error) {
        console.error("[notifyInventorySubmitted] invoke failed", error);
      } else {
        console.log("[notifyInventorySubmitted] invoke ok", data);
      }

      return { data, error };
    } catch (error) {
      console.error('[Notifications] Error in notifyInventorySubmitted:', error);
      return { data: null, error };
    }
  },

  
  // Simple success/error notifications for UI feedback
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message)
};