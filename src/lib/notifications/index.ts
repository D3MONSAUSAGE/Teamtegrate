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

  
  // Simple success/error notifications for UI feedback
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message)
};