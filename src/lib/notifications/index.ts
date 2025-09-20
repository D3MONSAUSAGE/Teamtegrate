import { sendEmail } from './email/resend';
import { sendPush } from './push/fcm';
import { supabase } from '@/integrations/supabase/client';

// Feature flag for safe rollout
const NOTIFICATIONS_V2 = process.env.NOTIFICATIONS_V2 !== 'false';

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

// Centralized notification orchestrator using only Resend + FCM
export const notifications = {
  // Ticket Created - notify requester (confirmation) + admins (new ticket alert)
  async notifyTicketCreated(ticket: TicketNotificationData, user: UserData) {
    if (!NOTIFICATIONS_V2) return;

    try {
      console.log(`[Notifications] Ticket created: ${ticket.id}`);

      const appBaseUrl = process.env.APP_BASE_URL || 'https://teamtegrate.com';
      const ticketUrl = `${appBaseUrl}/dashboard/requests/${ticket.id}`;

      // Send confirmation email to requester
      await sendEmail({
        to: user.email,
        subject: `✅ Ticket #${ticket.id} received - ${ticket.title}`,
        html: await this.getEmailTemplate('ticket_created_user', {
          userName: user.name || user.email,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          ticketDescription: ticket.description || '',
          ticketUrl,
          appBaseUrl
        })
      });

      // Get admin emails for notification
      const { data: admins } = await supabase
        .from('users')
        .select('id, email, name, push_token')
        .eq('organization_id', ticket.organization_id)
        .in('role', ['admin', 'superadmin']);

      if (admins && admins.length > 0) {
        // Send email to admins
        await sendEmail({
          to: admins.map(admin => admin.email),
          subject: `📩 New Ticket #${ticket.id} needs review`,
          html: await this.getEmailTemplate('ticket_created_admin', {
            adminName: 'Admin',
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            requesterName: user.name || user.email,
            requesterEmail: user.email,
            ticketUrl,
            appBaseUrl
          })
        });

        // Send push notifications to admins
        const adminTokens = admins.filter(admin => admin.push_token).map(admin => admin.push_token!);
        if (adminTokens.length > 0) {
          await sendPush({
            toTokens: adminTokens,
            title: 'New Ticket Created',
            body: `${ticket.title} - from ${user.name || user.email}`,
            data: {
              type: 'ticket_created',
              ticketId: ticket.id,
              route: '/dashboard/requests'
            }
          });
        }
      }

      await this.logNotification('ticket_created', user.id, { ticketId: ticket.id }, true);
    } catch (error) {
      console.error('[Notifications] Failed to send ticket created notifications:', error);
      await this.logNotification('ticket_created', user.id, { ticketId: ticket.id, error: String(error) }, false);
    }
  },

  // Ticket Assigned - notify new assignee
  async notifyTicketAssigned(ticket: TicketNotificationData, assignee: UserData, actor: UserData) {
    if (!NOTIFICATIONS_V2) return;

    try {
      console.log(`[Notifications] Ticket assigned: ${ticket.id} to ${assignee.id}`);

      const appBaseUrl = process.env.APP_BASE_URL || 'https://teamtegrate.com';
      const ticketUrl = `${appBaseUrl}/dashboard/requests/${ticket.id}`;

      // Send email to assignee
      await sendEmail({
        to: assignee.email,
        subject: `📋 Ticket #${ticket.id} assigned to you - ${ticket.title}`,
        html: await this.getEmailTemplate('ticket_assigned', {
          assigneeName: assignee.name || assignee.email,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          actorName: actor.name || actor.email,
          ticketUrl,
          appBaseUrl
        })
      });

      // Send push notification to assignee
      const { data: assigneeData } = await supabase
        .from('users')
        .select('push_token')
        .eq('id', assignee.id)
        .single();

      if (assigneeData?.push_token) {
        await sendPush({
          toTokens: [assigneeData.push_token],
          title: 'Ticket Assigned to You',
          body: `${ticket.title} - assigned by ${actor.name || actor.email}`,
          data: {
            type: 'ticket_assigned',
            ticketId: ticket.id,
            route: '/dashboard/requests'
          }
        });
      }

      await this.logNotification('ticket_assigned', assignee.id, { ticketId: ticket.id }, true);
    } catch (error) {
      console.error('[Notifications] Failed to send ticket assigned notifications:', error);
      await this.logNotification('ticket_assigned', assignee.id, { ticketId: ticket.id, error: String(error) }, false);
    }
  },

  // Status Updated - notify requester and assignee
  async notifyTicketUpdated(ticket: TicketNotificationData, oldStatus: string, newStatus: string, actor: UserData, message?: string) {
    if (!NOTIFICATIONS_V2) return;

    try {
      console.log(`[Notifications] Ticket updated: ${ticket.id} from ${oldStatus} to ${newStatus}`);

      const appBaseUrl = process.env.APP_BASE_URL || 'https://teamtegrate.com';
      const ticketUrl = `${appBaseUrl}/dashboard/requests/${ticket.id}`;

      // Get ticket requester and assignee
      const { data: ticketData } = await supabase
        .from('requests')
        .select(`
          requested_by,
          assigned_to,
          users_requested_by:users!requests_requested_by_fkey(id, email, name, push_token),
          users_assigned_to:users!requests_assigned_to_fkey(id, email, name, push_token)
        `)
        .eq('id', ticket.id)
        .single();

      if (!ticketData) return;

      const recipients: NotificationRecipient[] = [];
      // Handle Supabase relationship arrays - these come as arrays even for single relationships
      if (ticketData.users_requested_by && Array.isArray(ticketData.users_requested_by) && ticketData.users_requested_by.length > 0) {
        recipients.push(ticketData.users_requested_by[0] as NotificationRecipient);
      }
      if (ticketData.users_assigned_to && Array.isArray(ticketData.users_assigned_to) && ticketData.users_assigned_to.length > 0) {
        const assignee = ticketData.users_assigned_to[0] as NotificationRecipient;
        // Only add if different from requester
        const requester = ticketData.users_requested_by && Array.isArray(ticketData.users_requested_by) && ticketData.users_requested_by.length > 0 
          ? ticketData.users_requested_by[0] as NotificationRecipient 
          : null;
        if (!requester || assignee.id !== requester.id) {
          recipients.push(assignee);
        }
      }

      for (const recipient of recipients) {
        // Send email
        await sendEmail({
          to: recipient.email,
          subject: `🔄 Ticket #${ticket.id} status updated - ${newStatus}`,
          html: await this.getEmailTemplate('ticket_updated', {
            recipientName: recipient.name || recipient.email,
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            oldStatus,
            newStatus,
            actorName: actor.name || actor.email,
            message: message || '',
            ticketUrl,
            appBaseUrl
          })
        });

        // Send push notification
        if (recipient.push_token) {
          await sendPush({
            toTokens: [recipient.push_token],
            title: `Ticket Status Updated`,
            body: `${ticket.title} is now ${newStatus}`,
            data: {
              type: 'ticket_updated',
              ticketId: ticket.id,
              route: '/dashboard/requests'
            }
          });
        }
      }

      await this.logNotification('ticket_updated', actor.id, { ticketId: ticket.id, oldStatus, newStatus }, true);
    } catch (error) {
      console.error('[Notifications] Failed to send ticket updated notifications:', error);
      await this.logNotification('ticket_updated', actor.id, { ticketId: ticket.id, error: String(error) }, false);
    }
  },

  // Ticket Closed - notify requester with resolution
  async notifyTicketClosed(ticket: TicketNotificationData, resolution: string, actor: UserData) {
    if (!NOTIFICATIONS_V2) return;

    try {
      console.log(`[Notifications] Ticket closed: ${ticket.id}`);

      const appBaseUrl = process.env.APP_BASE_URL || 'https://teamtegrate.com';
      const ticketUrl = `${appBaseUrl}/dashboard/requests/${ticket.id}`;

      // Get ticket requester
      const { data: ticketData } = await supabase
        .from('requests')
        .select(`
          requested_by,
          users_requested_by:users!requests_requested_by_fkey(id, email, name, push_token)
        `)
        .eq('id', ticket.id)
        .single();

      if (!ticketData?.users_requested_by || !Array.isArray(ticketData.users_requested_by) || ticketData.users_requested_by.length === 0) return;

      const requester = ticketData.users_requested_by[0] as NotificationRecipient;

      // Send email to requester
      await sendEmail({
        to: requester.email,
        subject: `✅ Ticket #${ticket.id} resolved - ${ticket.title}`,
        html: await this.getEmailTemplate('ticket_closed', {
          requesterName: requester.name || requester.email,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          resolution,
          actorName: actor.name || actor.email,
          ticketUrl,
          appBaseUrl
        })
      });

      // Send push notification to requester
      if (requester.push_token) {
        await sendPush({
          toTokens: [requester.push_token],
          title: 'Ticket Resolved',
          body: `${ticket.title} has been resolved`,
          data: {
            type: 'ticket_closed',
            ticketId: ticket.id,
            route: '/dashboard/requests'
          }
        });
      }

      await this.logNotification('ticket_closed', requester.id, { ticketId: ticket.id }, true);
    } catch (error) {
      console.error('[Notifications] Failed to send ticket closed notifications:', error);
      await this.logNotification('ticket_closed', actor.id, { ticketId: ticket.id, error: String(error) }, false);
    }
  },

  // Email template renderer
  async getEmailTemplate(template: string, vars: Record<string, string>) {
    const brandName = process.env.BRAND_NAME || 'Teamtegrate';
    const brandLogo = process.env.BRAND_LOGO_URL || '';
    
    const templates = {
      ticket_created_user: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: hsl(217 91% 60%); color: white; padding: 20px; text-align: center;">
            ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="max-height: 40px; margin-bottom: 10px;">` : ''}
            <h1>${brandName}</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2>Ticket Received Successfully</h2>
            <p>Hi ${vars.userName},</p>
            <p>We've received your request and created ticket <strong>#${vars.ticketId}</strong>.</p>
            <div style="background: hsl(240 4.8% 95.9%); padding: 15px; margin: 20px 0; border-radius: 8px;">
              <h3>${vars.ticketTitle}</h3>
              ${vars.ticketDescription ? `<p>${vars.ticketDescription}</p>` : ''}
            </div>
            <p>Our team will review your request and get back to you shortly.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${vars.ticketUrl}" style="background: hsl(217 91% 60%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
            </div>
          </div>
          <div style="background: hsl(240 5.9% 90%); padding: 15px; text-align: center; font-size: 14px; color: hsl(240 3.8% 46.1%);">
            ${brandName} Support Team
          </div>
        </div>
      `,
      ticket_created_admin: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: hsl(217 91% 60%); color: white; padding: 20px; text-align: center;">
            ${brandLogo ? `<img src="${brandLogo}" alt="${brandName}" style="max-height: 40px; margin-bottom: 10px;">` : ''}
            <h1>${brandName}</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2>New Ticket Needs Review</h2>
            <p>Hi ${vars.adminName},</p>
            <p>A new ticket <strong>#${vars.ticketId}</strong> has been submitted and needs review.</p>
            <div style="background: hsl(240 4.8% 95.9%); padding: 15px; margin: 20px 0; border-radius: 8px;">
              <h3>${vars.ticketTitle}</h3>
              <p><strong>From:</strong> ${vars.requesterName} (${vars.requesterEmail})</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${vars.ticketUrl}" style="background: hsl(217 91% 60%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Ticket</a>
            </div>
          </div>
        </div>
      `,
      ticket_assigned: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: hsl(217 91% 60%); color: white; padding: 20px; text-align: center;">
            <h1>${brandName}</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2>Ticket Assigned to You</h2>
            <p>Hi ${vars.assigneeName},</p>
            <p>Ticket <strong>#${vars.ticketId}</strong> has been assigned to you by ${vars.actorName}.</p>
            <div style="background: hsl(240 4.8% 95.9%); padding: 15px; margin: 20px 0; border-radius: 8px;">
              <h3>${vars.ticketTitle}</h3>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${vars.ticketUrl}" style="background: hsl(217 91% 60%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
            </div>
          </div>
        </div>
      `,
      ticket_updated: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: hsl(217 91% 60%); color: white; padding: 20px; text-align: center;">
            <h1>${brandName}</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2>Ticket Status Updated</h2>
            <p>Hi ${vars.recipientName},</p>
            <p>Ticket <strong>#${vars.ticketId}</strong> status has been updated by ${vars.actorName}.</p>
            <div style="background: hsl(240 4.8% 95.9%); padding: 15px; margin: 20px 0; border-radius: 8px;">
              <h3>${vars.ticketTitle}</h3>
              <p><strong>Status:</strong> ${vars.oldStatus} → <strong>${vars.newStatus}</strong></p>
              ${vars.message ? `<p><strong>Message:</strong> ${vars.message}</p>` : ''}
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${vars.ticketUrl}" style="background: hsl(217 91% 60%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
            </div>
          </div>
        </div>
      `,
      ticket_closed: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: hsl(142 76% 36%); color: white; padding: 20px; text-align: center;">
            <h1>${brandName}</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2>Ticket Resolved</h2>
            <p>Hi ${vars.requesterName},</p>
            <p>Great news! Your ticket <strong>#${vars.ticketId}</strong> has been resolved by ${vars.actorName}.</p>
            <div style="background: hsl(142 76% 36% / 0.1); padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid hsl(142 76% 36%);">
              <h3>${vars.ticketTitle}</h3>
              <p><strong>Resolution:</strong> ${vars.resolution}</p>
            </div>
            <p>If you need further assistance, feel free to create a new ticket.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${vars.ticketUrl}" style="background: hsl(142 76% 36%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Resolved Ticket</a>
            </div>
          </div>
        </div>
      `
    };

    return templates[template as keyof typeof templates] || '';
  },

  // Log notification attempts for monitoring
  async logNotification(type: string, userId: string, metadata: Record<string, any>, success: boolean) {
    try {
      // For now, just log to console - system_error_logs table structure needs to be confirmed
      console.log('[Notifications] Log:', {
        type,
        userId,
        success,
        metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Notifications] Failed to log notification:', error);
    }
  }
};