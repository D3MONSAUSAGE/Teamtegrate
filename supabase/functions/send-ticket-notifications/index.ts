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

// Email template loader function with retry logic and structured logging
async function loadEmailTemplate(templateName: string, variables: Record<string, string>): Promise<string> {
  const retryCount = 3;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Email Template] Loading ${templateName}, attempt ${attempt}/${retryCount}`);
      
      const templatePath = new URL(`../../../src/emails/${templateName}`, import.meta.url);
      let templateContent = await Deno.readTextFile(templatePath);
      
      // Replace template variables
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        templateContent = templateContent.replace(regex, value || '');
      }
      
      console.log(`[Email Template] Successfully loaded ${templateName}`);
      return templateContent;
    } catch (error) {
      console.error(`[Email Template] Attempt ${attempt}/${retryCount} failed for ${templateName}:`, error);
      
      if (attempt === retryCount) {
        console.error(`[Email Template] All attempts failed for ${templateName}, using fallback`);
        // Fallback to basic template
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background: hsl(217 91% 60%); color: white; padding: 20px; text-align: center; margin-bottom: 20px; border-radius: 8px;">
              <h1>${variables.brandName || 'Notification'}</h1>
            </div>
            <div style="padding: 20px;">
              <h2>Ticket Notification</h2>
              <p>This is a notification about ticket <strong>#${variables.ticketId}</strong></p>
              <div style="background: hsl(240 4.8% 95.9%); padding: 15px; margin: 20px 0; border-radius: 8px;">
                <h3>${variables.ticketTitle}</h3>
                ${variables.ticketDescription ? `<p>${variables.ticketDescription}</p>` : ''}
                ${variables.resolution ? `<p><strong>Resolution:</strong> ${variables.resolution}</p>` : ''}
                ${variables.message ? `<p><strong>Message:</strong> ${variables.message}</p>` : ''}
              </div>
              ${variables.ticketUrl ? `
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${variables.ticketUrl}" style="background: hsl(217 91% 60%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
                </div>
              ` : ''}
            </div>
            <div style="background: hsl(240 5.9% 90%); padding: 15px; text-align: center; font-size: 14px; color: hsl(240 3.8% 46.1%); border-radius: 8px;">
              ${variables.brandName || 'TeamTegrate'} Support Team
            </div>
          </div>
        `;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Enhanced notification delivery with retry logic and structured logging
async function sendEmailWithRetry(resend: any, emailOptions: any, context: string): Promise<boolean> {
  const retryCount = 3;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Email Delivery] Sending ${context}, attempt ${attempt}/${retryCount}`, {
        to: emailOptions.to,
        subject: emailOptions.subject
      });
      
      const { error } = await resend.emails.send(emailOptions);
      
      if (error) {
        throw new Error(error.message || 'Unknown Resend error');
      }
      
      console.log(`[Email Delivery] Successfully sent ${context}`);
      return true;
    } catch (error) {
      console.error(`[Email Delivery] Attempt ${attempt}/${retryCount} failed for ${context}:`, error);
      
      if (attempt === retryCount) {
        console.error(`[Email Delivery] All attempts failed for ${context}`);
        return false;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return false;
}

// Enhanced push notification with retry logic and structured logging  
async function sendPushWithRetry(supabase: any, pushOptions: any, context: string): Promise<boolean> {
  const retryCount = 3;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Push Delivery] Sending ${context}, attempt ${attempt}/${retryCount}`, {
        user_id: pushOptions.user_id,
        title: pushOptions.title
      });
      
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: pushOptions
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`[Push Delivery] Successfully sent ${context}`);
      return true;
    } catch (error) {
      console.error(`[Push Delivery] Attempt ${attempt}/${retryCount} failed for ${context}:`, error);
      
      if (attempt === retryCount) {
        console.error(`[Push Delivery] All attempts failed for ${context}`);
        return false;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return false;
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

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    
    const requestData: TicketNotificationRequest = await req.json();
    const { type, ticket, user, assignee, actor, oldStatus, newStatus, message, resolution } = requestData;

    console.log(`[Notification Processing] Starting ${type} notification for ticket ${ticket.id}`);

    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://teamtegrate.com';
    const brandName = Deno.env.get('BRAND_NAME') || 'Teamtegrate';
    const ticketUrl = `${appBaseUrl}/dashboard/requests/${ticket.id}`;

    let emailsSent = 0;
    let pushNotificationsSent = 0;
    let emailErrors = 0;
    let pushErrors = 0;

    // Handle different notification types
    switch (type) {
      case 'ticket_created':
        if (user) {
          // Send confirmation email to requester
          if (resend) {
            const success = await sendEmailWithRetry(resend, {
              from: `${brandName} Support <support@requests.teamtegrate.com>`,
              to: user.email,
              subject: `✅ Ticket #${ticket.id} received - ${ticket.title}`,
              html: await loadEmailTemplate('ticket-created-user.html', {
                userName: user.name || user.email,
                ticketId: ticket.id,
                ticketTitle: ticket.title,
                ticketDescription: ticket.description || '',
                ticketUrl,
                brandName
              })
            }, 'user confirmation email');

            if (success) emailsSent++; else emailErrors++;
          }

          // Get admins and send notifications
          const { data: admins } = await supabase
            .from('users')
            .select('id, email, name, push_token')
            .eq('organization_id', ticket.organization_id)
            .in('role', ['admin', 'superadmin']);

          if (admins && admins.length > 0) {
            // Send email to admins
            if (resend) {
              const success = await sendEmailWithRetry(resend, {
                from: `${brandName} Support <support@requests.teamtegrate.com>`,
                to: admins.map(admin => admin.email),
                subject: `📩 New Ticket #${ticket.id} needs review`,
                html: await loadEmailTemplate('ticket-created-admin.html', {
                  adminName: 'Admin',
                  ticketId: ticket.id,
                  ticketTitle: ticket.title,
                  requesterName: user.name || user.email,
                  requesterEmail: user.email,
                  ticketUrl,
                  brandName
                })
              }, 'admin notification email');

              if (success) emailsSent++; else emailErrors++;
            }

            // Send push notifications to admins with FCM tokens
            const adminTokens = admins.filter(admin => admin.push_token).map(admin => admin.push_token);
            if (adminTokens.length > 0) {
              for (const token of adminTokens) {
                const success = await sendPushWithRetry(supabase, {
                  user_id: admins.find(a => a.push_token === token)?.id,
                  title: 'New Ticket Created',
                  content: `${ticket.title} - from ${user.name || user.email}`,
                  type: 'ticket_created',
                  metadata: {
                    ticketId: ticket.id,
                    route: '/dashboard/requests'
                  },
                  send_push: true
                }, 'admin push notification');

                if (success) pushNotificationsSent++; else pushErrors++;
              }
            }
          }
        }
        break;

      case 'ticket_assigned':
        if (assignee && actor) {
          // Send email to assignee
          if (resend) {
            const success = await sendEmailWithRetry(resend, {
              from: `${brandName} Support <support@requests.teamtegrate.com>`,
              to: assignee.email,
              subject: `📋 Ticket #${ticket.id} assigned to you - ${ticket.title}`,
              html: await loadEmailTemplate('ticket-assigned.html', {
                assigneeName: assignee.name || assignee.email,
                ticketId: ticket.id,
                ticketTitle: ticket.title,
                actorName: actor.name || actor.email,
                ticketUrl,
                brandName
              })
            }, 'assignment email');

            if (success) emailsSent++; else emailErrors++;
          }

          // Send push notification to assignee
          const success = await sendPushWithRetry(supabase, {
            user_id: assignee.id,
            title: 'Ticket Assigned to You',
            content: `${ticket.title} - assigned by ${actor.name || actor.email}`,
            type: 'ticket_assigned',
            metadata: {
              ticketId: ticket.id,
              route: '/dashboard/requests'
            },
            send_push: true
          }, 'assignment push notification');

          if (success) pushNotificationsSent++; else pushErrors++;
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
              if (resend) {
                const success = await sendEmailWithRetry(resend, {
                  from: `${brandName} Support <support@requests.teamtegrate.com>`,
                  to: recipient.email,
                  subject: `🔄 Ticket #${ticket.id} status updated - ${newStatus}`,
                  html: await loadEmailTemplate('ticket-updated.html', {
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
                }, 'update email');

                if (success) emailsSent++; else emailErrors++;
              }

              // Send push notification
              if (recipient.push_token) {
                const success = await sendPushWithRetry(supabase, {
                  user_id: recipient.id,
                  title: 'Ticket Status Updated',
                  content: `${ticket.title} is now ${newStatus}`,
                  type: 'ticket_updated',
                  metadata: {
                    ticketId: ticket.id,
                    route: '/dashboard/requests'
                  },
                  send_push: true
                }, 'update push notification');

                if (success) pushNotificationsSent++; else pushErrors++;
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
            if (resend) {
              const success = await sendEmailWithRetry(resend, {
                from: `${brandName} Support <support@requests.teamtegrate.com>`,
                to: requester.email,
                subject: `✅ Ticket #${ticket.id} resolved - ${ticket.title}`,
                html: await loadEmailTemplate('ticket-closed.html', {
                  requesterName: requester.name || requester.email,
                  ticketId: ticket.id,
                  ticketTitle: ticket.title,
                  resolution,
                  actorName: actor.name || actor.email,
                  ticketUrl,
                  brandName
                })
              }, 'resolution email');

              if (success) emailsSent++; else emailErrors++;
            }

            // Send push notification to requester
            if (requester.push_token) {
              const success = await sendPushWithRetry(supabase, {
                user_id: requester.id,
                title: 'Ticket Resolved',
                content: `${ticket.title} has been resolved`,
                type: 'ticket_closed',
                metadata: {
                  ticketId: ticket.id,
                  route: '/dashboard/requests'
                },
                send_push: true
              }, 'resolution push notification');

              if (success) pushNotificationsSent++; else pushErrors++;
            }
          }
        }
        break;
    }

    // Log notification delivery metrics
    console.log(`[Notification Summary] Type: ${type}, Ticket: ${ticket.id}`, {
      emailsSent,
      pushNotificationsSent,
      emailErrors,
      pushErrors,
      totalAttempts: emailsSent + pushNotificationsSent + emailErrors + pushErrors
    });

    return new Response(
      JSON.stringify({
        success: true,
        type,
        ticketId: ticket.id,
        emailsSent,
        pushNotificationsSent,
        emailErrors,
        pushErrors,
        message: `${type} notifications processed: ${emailsSent} emails, ${pushNotificationsSent} push notifications sent`
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
    console.error('[Notification Error] Failed to process notification:', error);
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

serve(handler);