import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
      console.error('[Email] Resend API error:', result);
      return {
        success: false,
        error: `Resend API error ${response.status}: ${result?.message || response.statusText}`
      };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('[Email] Network error:', error);
    return { success: false, error: `Network error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Dynamic CORS headers (copied from send-ticket-notifications)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

interface NotificationPayload {
  type: 'checklist_upcoming' | 'checklist_completed';
  recipients: string[];
  orgName: string;
  logoUrl?: string;
  teamName: string;
  checklist: {
    id: string;
    title: string;
    priority?: string;
  };
  run: {
    id: string;
    startTime?: string;
    endTime?: string;
    windowLabel: string;
  };
  actor: {
    id: string;
    name: string;
  };
  metrics?: {
    percentComplete?: number;
    itemsTotal?: number;
    itemsDone?: number;
  };
  completedBy?: string;
  notes?: string;
  // Legacy compatibility
  kind?: string;
  to?: string;
}

interface NotificationResponse {
  success: boolean;
  sent: number;
  total: number;
  failures?: string[];
  correlationId: string;
}

const resendApiKey = Deno.env.get("RESEND_API_KEY");

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`📧 Checklist notification started`, { correlationId });

    const payload: NotificationPayload = await req.json();
    payload.type = payload.type || payload.kind; // tolerate old callers
    const { type, recipients, orgName, teamName, checklist, run, actor, metrics, completedBy, notes } = payload;
    
    console.log('[send-checklist-notifications] start', { type, correlationId });

    // Normalize recipients
    let recipients_list: string[] = Array.isArray(recipients)
      ? recipients
      : (payload.to ? [payload.to] : []);
    recipients_list = recipients_list.map(e => String(e).toLowerCase().trim()).filter(Boolean);

    // Optional override for safe testing
    const TEST_RECIPIENTS = Deno.env.get("TEST_RECIPIENTS");
    if (TEST_RECIPIENTS) {
      recipients_list = TEST_RECIPIENTS.split(",").map(s => s.trim()).filter(Boolean);
    }

    // Deduplicate recipients
    const uniqueRecipients = Array.from(new Set(recipients_list));
    
    console.log(`📧 Sending ${type} notifications to ${uniqueRecipients.length} recipients`, { 
      correlationId,
      checklist: checklist.id,
      run: run.id
    });

    // Generate email content
    const { subject, html } = generateEmailContent(type, payload);

    // Send emails with Promise.allSettled (fan-out pattern)
    const emailPromises = uniqueRecipients.map(email => 
      sendEmail(email, subject, html, correlationId)
    );

    const results = await Promise.allSettled(emailPromises);
    
    // Process results
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failures = results
      .filter(r => r.status === 'rejected')
      .map(r => r.reason?.message || 'Unknown error');

    // Log results
    console.log(`CHECKLIST_NOTIFY { type: ${type}, checklistId: ${checklist.id}, runId: ${run.id}, sent: ${sent}, total: ${uniqueRecipients.length} }`, {
      correlationId
    });

    const response: NotificationResponse = {
      success: sent > 0,
      sent,
      total: uniqueRecipients.length,
      failures: failures.length > 0 ? failures : undefined,
      correlationId
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('❌ Checklist notification failed:', error, { correlationId });
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      correlationId
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});

async function sendEmail(to: string, subject: string, html: string, correlationId: string): Promise<void> {
  try {
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const result = await sendViaResend({
      apiKey: resendApiKey,
      from: "Teamtegrate <notifications@requests.teamtegrate.com>",
      to: [to],
      subject,
      html
    });

    if (!result.success) {
      throw new Error(result.error || 'Email send failed');
    }

    console.log(`📧 Email sent successfully to ${to}:`, result.id, { correlationId });
  } catch (error) {
    console.error(`📧 Failed to send email to ${to}:`, error, { correlationId });
    throw error;
  }
}

function generateEmailContent(type: string, payload: NotificationPayload): { subject: string; html: string } {
  const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://teamtegrate.com';
  const checklistUrl = `${appBaseUrl}/checklists/runs/${payload.run.id}`;
  
  const baseStyles = {
    container: "font-family: Inter, Segoe UI, Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;",
    header: "padding: 20px 24px; background: #0d3b66; color: #fff;",
    body: "padding: 28px 24px 8px; color: #111;",
    footer: "padding: 16px 24px; background: #fafbfe; border-top: 1px solid #eef0f5; color: #6b7280; font-size: 12px;",
    button: "display: inline-block; background: #0d3b66; color: #fff; text-decoration: none; font-weight: 600; border-radius: 8px; padding: 10px 16px;",
  };

  let subject: string;
  let preheader: string;
  let mainContent: string;
  let icon: string;

  if (type === 'checklist_upcoming') {
    subject = `📝 Upcoming Checklist — ${payload.teamName} — ${payload.checklist.title} — ${payload.run.windowLabel}`;
    preheader = 'Starts soon. Please prepare to run the checklist.';
    icon = '📝';
    mainContent = `
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Checklist starting soon</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#333;">
        The checklist <strong>"${esc(payload.checklist.title)}"</strong> for ${esc(payload.teamName)} is scheduled to start at <strong>${payload.run.windowLabel}</strong>.
      </p>
      
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr>
          <td style="font-size:14px;color:#555;"><strong>Team:</strong></td>
          <td style="font-size:14px;color:#111;padding-left:8px;">${esc(payload.teamName)}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#555;"><strong>Time Window:</strong></td>
          <td style="font-size:14px;color:#111;padding-left:8px;">${esc(payload.run.windowLabel)}</td>
        </tr>
        ${payload.checklist.priority ? `
        <tr>
          <td style="font-size:14px;color:#555;"><strong>Priority:</strong></td>
          <td style="font-size:14px;color:#111;padding-left:8px;">${esc(payload.checklist.priority)}</td>
        </tr>
        ` : ''}
      </table>
      
      <p style="margin:16px 0 8px;font-size:12px;color:#666;">Please ensure you're ready to complete the checklist during the scheduled time.</p>
    `;
  } else { // checklist_completed
    subject = `✅ Checklist Completed — ${payload.teamName} — ${payload.checklist.title}`;
    preheader = 'Checklist has been submitted. Review details and verification.';
    icon = '✅';
    mainContent = `
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Checklist completed</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#333;">
        The checklist <strong>"${esc(payload.checklist.title)}"</strong> for ${esc(payload.teamName)} has been submitted${payload.completedBy ? ` by ${esc(payload.completedBy)}` : ''}.
      </p>
      
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;">
        <tr>
          <td style="font-size:14px;color:#555;"><strong>Team:</strong></td>
          <td style="font-size:14px;color:#111;padding-left:8px;">${esc(payload.teamName)}</td>
        </tr>
        ${payload.metrics ? `
        <tr>
          <td style="font-size:14px;color:#555;"><strong>Completion:</strong></td>
          <td style="font-size:14px;color:#111;padding-left:8px;">${payload.metrics.percentComplete || 0}% (${payload.metrics.itemsDone || 0}/${payload.metrics.itemsTotal || 0} items)</td>
        </tr>
        ` : ''}
        ${payload.completedBy ? `
        <tr>
          <td style="font-size:14px;color:#555;"><strong>Completed by:</strong></td>
          <td style="font-size:14px;color:#111;padding-left:8px;">${esc(payload.completedBy)}</td>
        </tr>
        ` : ''}
      </table>
      
      ${payload.notes ? `
      <div style="background: #f8f9fa; padding: 12px; margin: 16px 0; border-radius: 8px; border-left: 3px solid #0d3b66;">
        <p style="margin:0;font-size:14px;color:#333;"><strong>Notes:</strong> ${esc(payload.notes)}</p>
      </div>
      ` : ''}
      
      <p style="margin:16px 0 8px;font-size:12px;color:#666;">Review the completed checklist and verify if required.</p>
    `;
  }

  const html = `
    <!-- preview text (hidden) -->
    <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="${baseStyles.container}">
            <!-- header -->
            <tr>
              <td style="${baseStyles.header}">
                <table role="presentation" width="100%"><tr>
                  <td align="left" style="font-size:18px;font-weight:600;">
                    ${payload.logoUrl ? `<img src="${payload.logoUrl}" alt="${esc(payload.orgName)} logo" width="28" height="28" style="vertical-align:middle;border:0;margin-right:8px;">` : ''}
                    ${esc(payload.orgName)}
                  </td>
                  <td align="right" style="font-size:12px;opacity:.9;">${icon} Checklist</td>
                </tr></table>
              </td>
            </tr>

            <!-- body -->
            <tr>
              <td style="${baseStyles.body}">
                ${mainContent}
                
                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 4px;">
                  <tr>
                    <td>
                      <a href="${checklistUrl}" style="${baseStyles.button}">Open checklist</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- footer -->
            <tr>
              <td style="${baseStyles.footer}">
                Teamtegrate Checklists • ${esc(payload.orgName)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return { subject, html };
}

function esc(str?: string): string {
  return (str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]!));
}