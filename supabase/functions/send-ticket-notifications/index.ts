import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketNotificationRequest {
  type: 'ticket_created' | 'ticket_assigned' | 'ticket_updated' | 'ticket_closed';
  ticket: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    created_at: string;
    organization_id: string;
  };
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  assignee?: {
    id: string;
    email: string;
    name?: string;
  };
  actor?: {
    id: string;
    email: string;
    name?: string;
  };
  oldStatus?: string;
  newStatus?: string;
  message?: string;
  resolution?: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '');
    
    const requestData: TicketNotificationRequest = await req.json();
    const { type, ticket, user, assignee, actor, oldStatus, newStatus, message, resolution } = requestData;

    console.log(`Processing ${type} notification for ticket ${ticket.id}`);

    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://teamtegrate.com';
    const brandName = Deno.env.get('BRAND_NAME') || 'Teamtegrate';
    const ticketUrl = `${appBaseUrl}/dashboard/requests/${ticket.id}`;

    let emailsSent = 0;
    let pushNotificationsSent = 0;

    // Handle different notification types
    switch (type) {
      case 'ticket_created':
        if (user) {
          // Send confirmation email to requester
          const { error: emailError } = await resend.emails.send({
            from: `${brandName} Support <support@requests.teamtegrate.com>`,
            to: user.email,
            subject: `✅ Ticket #${ticket.id} received - ${ticket.title}`,
            html: createTicketCreatedUserTemplate({
              userName: user.name || user.email,
              ticketId: ticket.id,
              ticketTitle: ticket.title,
              ticketDescription: ticket.description || '',
              ticketUrl,
              brandName
            })
          });

          if (!emailError) emailsSent++;

          // Get admins and send notifications
          const { data: admins } = await supabase
            .from('users')
            .select('id, email, name, push_token')
            .eq('organization_id', ticket.organization_id)
            .in('role', ['admin', 'superadmin']);

          if (admins && admins.length > 0) {
            // Send email to admins
            const { error: adminEmailError } = await resend.emails.send({
              from: `${brandName} Support <support@requests.teamtegrate.com>`,
              to: admins.map(admin => admin.email),
              subject: `📩 New Ticket #${ticket.id} needs review`,
              html: createTicketCreatedAdminTemplate({
                adminName: 'Admin',
                ticketId: ticket.id,
                ticketTitle: ticket.title,
                requesterName: user.name || user.email,
                requesterEmail: user.email,
                ticketUrl,
                brandName
              })
            });

            if (!adminEmailError) emailsSent++;

            // Send push notifications to admins with FCM tokens
            const adminTokens = admins.filter(admin => admin.push_token).map(admin => admin.push_token);
            if (adminTokens.length > 0) {
              for (const token of adminTokens) {
                const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
                  body: {
                    user_id: admins.find(a => a.push_token === token)?.id,
                    title: 'New Ticket Created',
                    content: `${ticket.title} - from ${user.name || user.email}`,
                    type: 'ticket_created',
                    metadata: {
                      ticketId: ticket.id,
                      route: '/dashboard/requests'
                    },
                    send_push: true
                  }
                });
                if (!pushError) pushNotificationsSent++;
              }
            }
          }
        }
        break;

      case 'ticket_assigned':
        if (assignee && actor) {
          // Send email to assignee
          const { error: emailError } = await resend.emails.send({
            from: `${brandName} Support <support@requests.teamtegrate.com>`,
            to: assignee.email,
            subject: `📋 Ticket #${ticket.id} assigned to you - ${ticket.title}`,
            html: createTicketAssignedTemplate({
              assigneeName: assignee.name || assignee.email,
              ticketId: ticket.id,
              ticketTitle: ticket.title,
              actorName: actor.name || actor.email,
              ticketUrl,
              brandName
            })
          });

          if (!emailError) emailsSent++;

          // Send push notification to assignee
          const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: assignee.id,
              title: 'Ticket Assigned to You',
              content: `${ticket.title} - assigned by ${actor.name || actor.email}`,
              type: 'ticket_assigned',
              metadata: {
                ticketId: ticket.id,
                route: '/dashboard/requests'
              },
              send_push: true
            }
          });
          if (!pushError) pushNotificationsSent++;
        }
        break;

      case 'ticket_updated':
        if (actor && oldStatus && newStatus) {
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

          if (ticketData) {
            const recipients = [];
            if (ticketData.users_requested_by && Array.isArray(ticketData.users_requested_by) && ticketData.users_requested_by.length > 0) {
              recipients.push(ticketData.users_requested_by[0]);
            }
            if (ticketData.users_assigned_to && Array.isArray(ticketData.users_assigned_to) && ticketData.users_assigned_to.length > 0) {
              const assignee = ticketData.users_assigned_to[0];
              const requester = recipients[0];
              if (!requester || assignee.id !== requester.id) {
                recipients.push(assignee);
              }
            }

            for (const recipient of recipients) {
              // Send email
              const { error: emailError } = await resend.emails.send({
                from: `${brandName} Support <support@requests.teamtegrate.com>`,
                to: recipient.email,
                subject: `🔄 Ticket #${ticket.id} status updated - ${newStatus}`,
                html: createTicketUpdatedTemplate({
                  recipientName: recipient.name || recipient.email,
                  ticketId: ticket.id,
                  ticketTitle: ticket.title,
                  oldStatus,
                  newStatus,
                  actorName: actor.name || actor.email,
                  message: message || '',
                  ticketUrl,
                  brandName
                })
              });

              if (!emailError) emailsSent++;

              // Send push notification
              if (recipient.push_token) {
                const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
                  body: {
                    user_id: recipient.id,
                    title: 'Ticket Status Updated',
                    content: `${ticket.title} is now ${newStatus}`,
                    type: 'ticket_updated',
                    metadata: {
                      ticketId: ticket.id,
                      route: '/dashboard/requests'
                    },
                    send_push: true
                  }
                });
                if (!pushError) pushNotificationsSent++;
              }
            }
          }
        }
        break;

      case 'ticket_closed':
        if (actor && resolution) {
          // Get ticket requester
          const { data: ticketData } = await supabase
            .from('requests')
            .select(`
              requested_by,
              users_requested_by:users!requests_requested_by_fkey(id, email, name, push_token)
            `)
            .eq('id', ticket.id)
            .single();

          if (ticketData?.users_requested_by && Array.isArray(ticketData.users_requested_by) && ticketData.users_requested_by.length > 0) {
            const requester = ticketData.users_requested_by[0];

            // Send email to requester
            const { error: emailError } = await resend.emails.send({
              from: `${brandName} Support <support@requests.teamtegrate.com>`,
              to: requester.email,
              subject: `✅ Ticket #${ticket.id} resolved - ${ticket.title}`,
              html: createTicketClosedTemplate({
                requesterName: requester.name || requester.email,
                ticketId: ticket.id,
                ticketTitle: ticket.title,
                resolution,
                actorName: actor.name || actor.email,
                ticketUrl,
                brandName
              })
            });

            if (!emailError) emailsSent++;

            // Send push notification to requester
            if (requester.push_token) {
              const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
                body: {
                  user_id: requester.id,
                  title: 'Ticket Resolved',
                  content: `${ticket.title} has been resolved`,
                  type: 'ticket_closed',
                  metadata: {
                    ticketId: ticket.id,
                    route: '/dashboard/requests'
                  },
                  send_push: true
                }
              });
              if (!pushError) pushNotificationsSent++;
            }
          }
        }
        break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        ticketId: ticket.id,
        emailsSent,
        pushNotificationsSent,
        message: `${type} notifications processed successfully`
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-ticket-notifications function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    );
  }
};

// Email template functions
function createTicketCreatedUserTemplate(vars: Record<string, string>) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: hsl(217 91% 60%); color: white; padding: 20px; text-align: center;">
        <h1>${vars.brandName}</h1>
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
        ${vars.brandName} Support Team
      </div>
    </div>
  `;
}

function createTicketCreatedAdminTemplate(vars: Record<string, string>) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: hsl(217 91% 60%); color: white; padding: 20px; text-align: center;">
        <h1>${vars.brandName}</h1>
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
  `;
}

function createTicketAssignedTemplate(vars: Record<string, string>) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: hsl(217 91% 60%); color: white; padding: 20px; text-align: center;">
        <h1>${vars.brandName}</h1>
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
  `;
}

function createTicketUpdatedTemplate(vars: Record<string, string>) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: hsl(217 91% 60%); color: white; padding: 20px; text-align: center;">
        <h1>${vars.brandName}</h1>
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
  `;
}

function createTicketClosedTemplate(vars: Record<string, string>) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: hsl(142 76% 36%); color: white; padding: 20px; text-align: center;">
        <h1>${vars.brandName}</h1>
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
  `;
}

serve(handler);