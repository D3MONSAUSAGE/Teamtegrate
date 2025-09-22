import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  kind: 'checklist_submitted' | 'checklist_verified' | 'checklist_rejected';
  recipients: string[];
  instance: {
    id: string;
    display_code?: string;
    name: string;
    team_name?: string;
    date: string;
  };
  actor: {
    name: string;
    email: string;
  };
  org: {
    name: string;
  };
}

interface NotificationResponse {
  success: boolean;
  emailsSent: number;
  failures: string[];
  correlationId: string;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@lovable.dev';
const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://localhost:5173';

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`📧 Checklist notification started`, { correlationId });

    const payload: NotificationPayload = await req.json();
    const { kind, recipients, instance, actor, org } = payload;

    // Deduplicate recipients
    const uniqueRecipients = Array.from(new Set(recipients.map(email => email.toLowerCase().trim())));
    
    console.log(`📧 Sending ${kind} notifications to ${uniqueRecipients.length} recipients`, { 
      correlationId,
      instance: instance.display_code || instance.id 
    });

    // Check for duplicate sends
    const eventId = `${kind}:${instance.id}`;
    
    // Create email content based on kind
    const { subject, html } = generateEmailContent(kind, instance, actor, org);

    // Fan out emails with Promise.allSettled for resilience
    const emailPromises = uniqueRecipients.map(async (email) => {
      try {
        const emailResponse = await resend.emails.send({
          from: `${org.name} <${fromEmail}>`,
          to: [email],
          subject,
          html,
          reply_to: fromEmail
        });

        console.log(`✅ Email sent to ${email}`, { correlationId, emailId: emailResponse.data?.id });
        return { success: true, email, id: emailResponse.data?.id };
      } catch (error) {
        console.error(`❌ Failed to send email to ${email}:`, error, { correlationId });
        return { success: false, email, error: error.message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    let emailsSent = 0;
    const failures: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        emailsSent++;
      } else {
        const email = uniqueRecipients[index];
        const errorMsg = result.status === 'rejected' 
          ? result.reason 
          : (result.value as any).error;
        failures.push(`${email}: ${errorMsg}`);
      }
    });

    const response: NotificationResponse = {
      success: failures.length === 0,
      emailsSent,
      failures,
      correlationId
    };

    console.log(`📧 Notification completed:`, response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('❌ Notification failed:', error, { correlationId });
    
    const response: NotificationResponse = {
      success: false,
      emailsSent: 0,
      failures: [`System error: ${error.message}`],
      correlationId
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});

function generateEmailContent(
  kind: string, 
  instance: NotificationPayload['instance'], 
  actor: NotificationPayload['actor'], 
  org: NotificationPayload['org']
) {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    color: #334155;
  `;

  const linkStyles = `
    display: inline-block;
    padding: 12px 24px;
    background: #3b82f6;
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 16px 0;
  `;

  const displayCode = instance.display_code || instance.id.substring(0, 8).toUpperCase();
  const viewUrl = `${appBaseUrl}/checklists/${instance.id}`;

  switch (kind) {
    case 'checklist_submitted':
      return {
        subject: `✅ Checklist Submitted: ${instance.name} – ${instance.team_name} – ${instance.date}`,
        html: `
          <div style="${baseStyles}">
            <h1>Checklist Submitted for Verification</h1>
            <p><strong>Code:</strong> ${displayCode}</p>
            <p><strong>Checklist:</strong> ${instance.name}</p>
            <p><strong>Team:</strong> ${instance.team_name}</p>
            <p><strong>Date:</strong> ${instance.date}</p>
            <p><strong>Submitted by:</strong> ${actor.name}</p>
            <a href="${viewUrl}" style="${linkStyles}">Review & Verify Checklist</a>
            <p style="color: #64748b; font-size: 14px;">
              This checklist has been completed and is awaiting your verification.
            </p>
          </div>
        `
      };

    case 'checklist_verified':
      return {
        subject: `🔒 Checklist Verified: ${instance.name} – ${instance.team_name} – ${instance.date}`,
        html: `
          <div style="${baseStyles}">
            <h1>Checklist Verified</h1>
            <p><strong>Code:</strong> ${displayCode}</p>
            <p><strong>Checklist:</strong> ${instance.name}</p>
            <p><strong>Team:</strong> ${instance.team_name}</p>
            <p><strong>Date:</strong> ${instance.date}</p>
            <p><strong>Verified by:</strong> ${actor.name}</p>
            <a href="${viewUrl}" style="${linkStyles}">View Verified Checklist</a>
            <p style="color: #059669; font-size: 14px;">
              ✅ Your checklist has been successfully verified and completed.
            </p>
          </div>
        `
      };

    case 'checklist_rejected':
      return {
        subject: `⚠️ Checklist Requires Attention: ${instance.name} – ${instance.team_name}`,
        html: `
          <div style="${baseStyles}">
            <h1>Checklist Requires Attention</h1>
            <p><strong>Code:</strong> ${displayCode}</p>
            <p><strong>Checklist:</strong> ${instance.name}</p>
            <p><strong>Team:</strong> ${instance.team_name}</p>
            <p><strong>Date:</strong> ${instance.date}</p>
            <p><strong>Reviewed by:</strong> ${actor.name}</p>
            <a href="${viewUrl}" style="${linkStyles}">Review & Resubmit Checklist</a>
            <p style="color: #dc2626; font-size: 14px;">
              ⚠️ This checklist needs corrections before it can be verified. Please review the feedback and resubmit.
            </p>
          </div>
        `
      };

    default:
      throw new Error(`Unknown notification kind: ${kind}`);
  }
}