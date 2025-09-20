import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestNotificationData {
  request_id: string;
  notification_type: 'created' | 'assigned' | 'status_changed' | 'completed';
  old_status?: string;
  new_status?: string;
  assigned_to?: string;
  message?: string;
}

const getEmailTemplate = (type: string, requestData: any, userData: any) => {
  const baseUrl = 'https://zlfpiovyodiyecdueiig.supabase.co';
  
  const templates = {
    created: {
      subject: `New Request: ${requestData.title}`,
      html: `
        <h2>New Request Created</h2>
        <p>Hi ${userData.name},</p>
        <p>A new request has been created and requires your attention:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${requestData.title}</h3>
          <p><strong>Ticket #:</strong> ${requestData.ticket_number || 'N/A'}</p>
          <p><strong>Priority:</strong> ${requestData.priority}</p>
          <p><strong>Status:</strong> ${requestData.status}</p>
          <p><strong>Description:</strong> ${requestData.description || 'No description provided'}</p>
          <p><strong>Requested by:</strong> ${requestData.requester_name}</p>
        </div>
        <p><a href="${baseUrl}/dashboard/requests" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a></p>
        <p>Best regards,<br>Teamtegrate</p>
      `
    },
    assigned: {
      subject: `Request Assigned: ${requestData.title}`,
      html: `
        <h2>Request Assigned to You</h2>
        <p>Hi ${userData.name},</p>
        <p>You have been assigned to work on the following request:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${requestData.title}</h3>
          <p><strong>Ticket #:</strong> ${requestData.ticket_number || 'N/A'}</p>
          <p><strong>Priority:</strong> ${requestData.priority}</p>
          <p><strong>Status:</strong> ${requestData.status}</p>
          <p><strong>Description:</strong> ${requestData.description || 'No description provided'}</p>
        </div>
        <p><a href="${baseUrl}/dashboard/requests" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a></p>
        <p>Best regards,<br>Teamtegrate</p>
      `
    },
    status_changed: {
      subject: `Request Status Updated: ${requestData.title}`,
      html: `
        <h2>Request Status Updated</h2>
        <p>Hi ${userData.name},</p>
        <p>The status of your request has been updated:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${requestData.title}</h3>
          <p><strong>Ticket #:</strong> ${requestData.ticket_number || 'N/A'}</p>
          <p><strong>Previous Status:</strong> ${requestData.old_status || 'N/A'}</p>
          <p><strong>New Status:</strong> ${requestData.new_status}</p>
          <p><strong>Priority:</strong> ${requestData.priority}</p>
        </div>
        <p><a href="${baseUrl}/dashboard/requests" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a></p>
        <p>Best regards,<br>Teamtegrate</p>
      `
    },
    completed: {
      subject: `Request Completed: ${requestData.title}`,
      html: `
        <h2>Request Completed</h2>
        <p>Hi ${userData.name},</p>
        <p>Your request has been completed successfully!</p>
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3>${requestData.title}</h3>
          <p><strong>Ticket #:</strong> ${requestData.ticket_number || 'N/A'}</p>
          <p><strong>Status:</strong> Completed</p>
          <p><strong>Completed At:</strong> ${new Date(requestData.completed_at).toLocaleString()}</p>
        </div>
        <p><a href="${baseUrl}/dashboard/requests" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Request</a></p>
        <p>Best regards,<br>Teamtegrate</p>
      `
    }
  };
  
  return templates[type as keyof typeof templates];
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request_id, notification_type, old_status, new_status, assigned_to, message }: RequestNotificationData = await req.json();

    console.log('Processing notification:', { request_id, notification_type, old_status, new_status });

    // Get request details with related data
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        request_type:request_types(name, category),
        requested_by_user:users!requests_requested_by_fkey(name, email)
      `)
      .eq('id', request_id)
      .single();

    if (requestError || !requestData) {
      console.error('Failed to fetch request data:', requestError);
      return new Response(JSON.stringify({ error: 'Request not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get notification recipients using the database function
    const { data: recipients, error: recipientsError } = await supabase
      .rpc('get_request_notification_recipients', { request_id_param: request_id });

    if (recipientsError) {
      console.error('Failed to get recipients:', recipientsError);
      return new Response(JSON.stringify({ error: 'Failed to get recipients' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found recipients:', recipients?.length || 0);

    // Filter recipients based on notification type and preferences
    let relevantRecipients = recipients || [];
    
    if (notification_type === 'assigned' && assigned_to) {
      relevantRecipients = relevantRecipients.filter(r => r.user_id === assigned_to || r.notification_type === 'requester');
    } else if (notification_type === 'completed') {
      relevantRecipients = relevantRecipients.filter(r => r.notification_type === 'requester');
    }

    // Check email preferences for each recipient
    const finalRecipients = [];
    for (const recipient of relevantRecipients) {
      const { data: prefs } = await supabase
        .from('email_notification_preferences')
        .select('*')
        .eq('user_id', recipient.user_id)
        .single();

      // Default to enabled if no preferences set
      const shouldSend = !prefs || 
        (notification_type === 'created' && prefs.request_created) ||
        (notification_type === 'assigned' && prefs.request_assigned) ||
        (notification_type === 'status_changed' && prefs.request_status_changed) ||
        (notification_type === 'completed' && prefs.request_completed);

      if (shouldSend && recipient.email) {
        finalRecipients.push(recipient);
      }
    }

    console.log('Final recipients after filtering:', finalRecipients.length);

    // Send emails to each recipient
    const emailResults = [];
    for (const recipient of finalRecipients) {
      try {
        const enrichedRequestData = {
          ...requestData,
          old_status,
          new_status,
          requester_name: requestData.requested_by_user?.name || 'Unknown User'
        };

        const emailTemplate = getEmailTemplate(notification_type, enrichedRequestData, recipient);
        if (!emailTemplate) {
          console.warn('No email template for notification type:', notification_type);
          continue;
        }

        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: 'Teamtegrate <notifications@teamtegrate.com>',
          to: [recipient.email],
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        if (emailError) {
          console.error(`Failed to send email to ${recipient.email}:`, emailError);
          emailResults.push({ recipient: recipient.email, success: false, error: emailError });
        } else {
          console.log(`Email sent successfully to ${recipient.email}`);
          emailResults.push({ recipient: recipient.email, success: true, id: emailResult.id });
        }
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
        emailResults.push({ recipient: recipient.email, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${notification_type} notification for request ${request_id}`,
      results: emailResults,
      recipients_count: finalRecipients.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-request-notification function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);