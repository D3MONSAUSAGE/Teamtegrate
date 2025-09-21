import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

interface TicketNotificationRequest {
  type: 'ticket_created' | 'ticket_assigned' | 'ticket_updated' | 'ticket_closed' | 'ticket_completed';
  ticket: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    created_at: string;
    organization_id: string;
    ticket_number?: string;
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

// Direct Resend API call function
async function sendViaResend(options: {
  apiKey: string;
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log('[Email Delivery] Sending via Resend API:', {
      to: options.to,
      subject: options.subject,
      from: options.from
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Email Delivery] Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        result
      });
      return {
        success: false,
        error: `Resend API error ${response.status}: ${result?.message || response.statusText}`
      };
    }

    console.log('[Email Delivery] Email sent successfully:', result?.id);
    return {
      success: true,
      id: result?.id
    };
  } catch (error) {
    console.error('[Email Delivery] Network error:', error);
    return {
      success: false,
      error: `Network error: ${error.message}`
    };
  }
}

// Enhanced notification delivery with retry logic and structured logging
async function sendEmailWithRetry(apiKey: string, fromEmail: string, emailOptions: any, context: string): Promise<boolean> {
  const retryCount = 3;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Email Delivery] Sending ${context}, attempt ${attempt}/${retryCount}`, {
        to: emailOptions.to,
        subject: emailOptions.subject
      });
      
      const result = await sendViaResend({
        apiKey,
        from: fromEmail,
        ...emailOptions
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown Resend error');
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

// HTML escape utility function
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Email template renderers
function renderCreatedEmail({ ticketNo, title, requesterName, baseUrl, id }: any) {
  const url = `${baseUrl}/requests/${id}`;
  return `
    <h2 style="margin:0 0 12px;font-family:Inter,Arial">Your request was received</h2>
    <p style="margin:0 0 12px">Hi${requesterName ? " " + requesterName : ""},</p>
    <p style="margin:0 0 12px">We've created your request <strong>${ticketNo}</strong>.</p>
    <p style="margin:0 0 12px"><strong>Title:</strong> ${escapeHtml(title ?? "")}</p>
    <p style="margin:16px 0"><a href="${url}">View request</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
    <p style="color:#666;font-size:12px">Teamtegrate Support</p>
  `;
}

function renderCompletedEmail({ ticketNo, title, baseUrl, id }: any) {
  const url = `${baseUrl}/requests/${id}`;
  return `
    <h2 style="margin:0 0 12px;font-family:Inter,Arial">Your request is completed</h2>
    <p style="margin:0 0 12px">Great news—request <strong>${ticketNo}</strong> has been completed.</p>
    <p style="margin:0 0 12px"><strong>Title:</strong> ${escapeHtml(title ?? "")}</p>
    <p style="margin:16px 0"><a href="${url}">Review outcome</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
    <p style="color:#666;font-size:12px">Teamtegrate Support</p>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('[Request] Processing notification request...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[Config] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured' 
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const requestData: TicketNotificationRequest = await req.json();
    const { type, ticket, user, assignee, actor, oldStatus, newStatus, message, resolution } = requestData;

    console.log(`[Notification Processing] Starting ${type} notification for ticket ${ticket.id}`);

    // Get human-readable ticket number
    const uiNo = ticket?.ticket_number ?? null;
    const rawId = ticket?.id ?? "";
    const ticketNo = uiNo || (rawId.startsWith("REQ-") ? rawId : rawId.slice(0, 8));

    // Get configuration from environment variables
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://teamtegrate.com';
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'Teamtegrate Support <support@requests.teamtegrate.com>';
    const brandName = 'Teamtegrate';
    const ticketUrl = `${appBaseUrl}/dashboard/requests/${ticket.id}`;

    console.log('[Config] Using configuration:', {
      appBaseUrl,
      fromEmail,
      ticketUrl,
      ticketNo
    });

    let emailsSent = 0;
    let pushNotificationsSent = 0;
    let emailErrors = 0;
    let pushErrors = 0;

    // Handle different notification types
    switch (type) {
      case 'ticket_created':
        if (user) {
          // Send confirmation email to requester
          const subject = `✅ Request ${ticketNo} received — ${ticket.title ?? ""}`;
          const userEmailSuccess = await sendEmailWithRetry(resendApiKey, fromEmail, {
            to: user.email,
            subject,
            html: renderCreatedEmail({
              ticketNo,
              title: ticket.title,
              requesterName: user.name,
              baseUrl: appBaseUrl,
              id: ticket.id
            })
          }, 'user confirmation email');

          if (userEmailSuccess) emailsSent++; else emailErrors++;

          // Get admins and send notifications
          const { data: admins } = await supabase
            .from('users')
            .select('id, email, name, push_token')
            .eq('organization_id', ticket.organization_id)
            .in('role', ['admin', 'superadmin']);

          if (admins && admins.length > 0) {
            // Send email to admins
            const adminEmailSuccess = await sendEmailWithRetry(resendApiKey, fromEmail, {
              to: admins.map(admin => admin.email),
              subject: `📩 New Request ${ticketNo} needs review`,
              html: await loadEmailTemplate('ticket-created-admin.html', {
                adminName: 'Admin',
                ticketId: ticketNo,
                ticketTitle: ticket.title,
                requesterName: user.name || user.email,
                requesterEmail: user.email,
                ticketUrl,
                brandName
              })
            }, 'admin notification email');

            if (adminEmailSuccess) emailsSent++; else emailErrors++;

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
          const subject = `📋 Request ${ticketNo} assigned to you — ${ticket.title ?? ""}`;
          const success = await sendEmailWithRetry(resendApiKey, fromEmail, {
            to: assignee.email,
            subject,
            html: await loadEmailTemplate('ticket-assigned.html', {
              assigneeName: assignee.name || assignee.email,
              ticketId: ticketNo,
              ticketTitle: ticket.title,
              actorName: actor.name || actor.email,
              ticketUrl,
              brandName
            })
          }, 'assignment email');

          if (success) emailsSent++; else emailErrors++;

          // Send push notification to assignee
          const pushSuccess = await sendPushWithRetry(supabase, {
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

          if (pushSuccess) pushNotificationsSent++; else pushErrors++;
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
              const subject = `🔄 Request ${ticketNo} status updated — ${newStatus}`;
              const success = await sendEmailWithRetry(resendApiKey, fromEmail, {
                to: recipient.email,
                subject,
                html: await loadEmailTemplate('ticket-updated.html', {
                  recipientName: recipient.name || recipient.email,
                  ticketId: ticketNo,
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

              // Send push notification
              if (recipient.push_token) {
                const pushSuccess = await sendPushWithRetry(supabase, {
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

                if (pushSuccess) pushNotificationsSent++; else pushErrors++;
              }
            }
          }
        }
        break;

      case 'ticket_completed':
        if (actor) {
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

            // Send completion email to requester
            const subject = `✅ Request ${ticketNo} completed — ${ticket.title ?? ""}`;
            const success = await sendEmailWithRetry(resendApiKey, fromEmail, {
              to: requester.email,
              subject,
              html: renderCompletedEmail({
                ticketNo,
                title: ticket.title,
                baseUrl: appBaseUrl,
                id: ticket.id
              })
            }, 'completion email');

            if (success) emailsSent++; else emailErrors++;
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
            const subject = `✅ Request ${ticketNo} resolved — ${ticket.title ?? ""}`;
            const success = await sendEmailWithRetry(resendApiKey, fromEmail, {
              to: requester.email,
              subject,
              html: await loadEmailTemplate('ticket-closed.html', {
                requesterName: requester.name || requester.email,
                ticketId: ticketNo,
                ticketTitle: ticket.title,
                resolution,
                actorName: actor.name || actor.email,
                ticketUrl,
                brandName
              })
            }, 'resolution email');

            if (success) emailsSent++; else emailErrors++;

            // Send push notification to requester
            if (requester.push_token) {
              const pushSuccess = await sendPushWithRetry(supabase, {
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

              if (pushSuccess) pushNotificationsSent++; else pushErrors++;
            }
          }
        }
        break;

      default:
        console.warn(`[Notification Processing] Unknown notification type: ${type}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown notification type: ${type}` 
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
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
    console.error('[Notification Processing] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        details: error.stack || 'No stack trace available'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);