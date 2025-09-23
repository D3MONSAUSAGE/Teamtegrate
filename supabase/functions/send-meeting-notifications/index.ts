import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Dynamic CORS function matching existing notification patterns
function cors(req: Request) {
  const requested =
    req.headers.get("Access-Control-Request-Headers") ??
    "authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-api-version";
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": requested,
    "Vary": "Origin, Access-Control-Request-Headers",
    "Content-Type": "application/json",
  };
}

// Meeting notification request interface
interface MeetingNotificationRequest {
  version: string;
  type: 'created' | 'response' | 'updated' | 'cancelled';
  organizer: {
    id: string;
    email: string;
    name?: string;
  };
  participants: Array<{
    id: string;
    email: string;
    name?: string;
  }>;
  meeting: {
    id: string;
    title: string;
    location?: string;
    startISO: string;
    endISO?: string;
    notes?: string;
    timezone?: string;
  };
  responder?: {
    id: string;
    name?: string;
    response: 'accepted' | 'declined' | 'tentative';
  };
  recipients?: string[];
}

// Enhanced HTML escaping function
function esc(s?: string) {
  return (s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]!));
}

// Date formatting functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

function formatTimeRange(startISO: string, endISO?: string): string {
  const start = formatTime(startISO);
  if (!endISO) return start;
  const end = formatTime(endISO);
  return `${start} - ${end}`;
}

// Meeting email context interface
interface MeetingEmailContext {
  orgName: string;
  logoUrl: string;
  meetingTitle: string;
  organizerName: string;
  meetingDate: string;
  meetingTime: string;
  location?: string;
  participantCount: number;
  meetingUrl: string;
  responderName?: string;
  responseType?: string;
  notes?: string;
}

// Professional meeting invitation email template
function renderMeetingInvitationHTML(ctx: MeetingEmailContext): string {
  const x = {
    ...ctx,
    orgName: esc(ctx.orgName),
    meetingTitle: esc(ctx.meetingTitle),
    organizerName: esc(ctx.organizerName),
    location: esc(ctx.location),
    notes: esc(ctx.notes)
  };

  return `<!-- preview text (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;">
  You're invited to: ${x.meetingTitle} — ${x.meetingDate}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;">
        <!-- header -->
        <tr>
          <td style="padding:20px 24px;background:#0d3b66;color:#fff;">
            <table role="presentation" width="100%"><tr>
              <td align="left" style="font-size:18px;font-weight:600;">
                <img src="${x.logoUrl}" alt="${x.orgName} logo" width="28" height="28" style="vertical-align:middle;border:0;margin-right:8px;">
                ${x.orgName}
              </td>
              <td align="right" style="font-size:12px;opacity:.9;">📅 Meeting Invitation</td>
            </tr></table>
          </td>
        </tr>

        <!-- title -->
        <tr>
          <td style="padding:28px 24px 0;color:#111;">
            <h1 style="margin:0 0 6px;font-size:22px;line-height:1.3;">📅 You're invited to a meeting</h1>
            <p style="margin:0 0 12px;font-size:14px;color:#333;">
              ${x.organizerName} has invited you to join a meeting.
            </p>
          </td>
        </tr>

        <!-- meeting details -->
        <tr>
          <td style="padding:8px 24px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #eef0f5;border-radius:8px;">
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;width:120px;"><strong>Meeting</strong></td>
                <td style="padding:12px 14px;font-size:14px;color:#111;border-bottom:1px solid #eef0f5;font-weight:600;">${x.meetingTitle}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;"><strong>Date</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;border-bottom:1px solid #eef0f5;">${x.meetingDate}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;"><strong>Time</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;border-bottom:1px solid #eef0f5;">${x.meetingTime}</td>
              </tr>
              ${x.location ? `
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;"><strong>Location</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;border-bottom:1px solid #eef0f5;">${x.location}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;"><strong>Organizer</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;border-bottom:1px solid #eef0f5;">${x.organizerName}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;"><strong>Participants</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;">${x.participantCount} invited</td>
              </tr>
            </table>
          </td>
        </tr>

        ${x.notes ? `
        <!-- meeting notes -->
        <tr>
          <td style="padding:18px 24px 0;">
            <h3 style="margin:0 0 8px;font-size:14px;color:#111;">Meeting Notes</h3>
            <div style="background:#f8f9fa;padding:12px;border-radius:6px;font-size:13px;color:#555;line-height:1.4;">
              ${x.notes}
            </div>
          </td>
        </tr>
        ` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:20px 24px 4px;">
            <a href="${x.meetingUrl}" style="display:inline-block;background:#0d3b66;color:#fff;text-decoration:none;font-weight:600;border-radius:8px;padding:12px 20px;margin-right:12px;">View Meeting</a>
            <span style="font-size:12px;color:#666;">Respond to let the organizer know if you can attend</span>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:16px 24px;background:#fafbfe;border-top:1px solid #eef0f5;color:#6b7280;font-size:12px;">
            ${x.orgName} • Meeting Management • This is an automated invitation
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

// Meeting response notification email template (for organizer)
function renderMeetingResponseHTML(ctx: MeetingEmailContext): string {
  const x = {
    ...ctx,
    orgName: esc(ctx.orgName),
    meetingTitle: esc(ctx.meetingTitle),
    responderName: esc(ctx.responderName),
    responseType: ctx.responseType
  };

  const responseEmoji = {
    'accepted': '✅',
    'declined': '❌', 
    'tentative': '⚠️'
  }[x.responseType || 'accepted'] || '📝';

  const responseColor = {
    'accepted': '#16a34a',
    'declined': '#dc2626',
    'tentative': '#ea580c'
  }[x.responseType || 'accepted'] || '#6b7280';

  return `<!-- preview text (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;">
  ${x.responderName} ${x.responseType} your meeting invitation
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;">
        <!-- header -->
        <tr>
          <td style="padding:20px 24px;background:#0d3b66;color:#fff;">
            <table role="presentation" width="100%"><tr>
              <td align="left" style="font-size:18px;font-weight:600;">
                <img src="${x.logoUrl}" alt="${x.orgName} logo" width="28" height="28" style="vertical-align:middle;border:0;margin-right:8px;">
                ${x.orgName}
              </td>
              <td align="right" style="font-size:12px;opacity:.9;">${responseEmoji} Meeting Response</td>
            </tr></table>
          </td>
        </tr>

        <!-- title -->
        <tr>
          <td style="padding:28px 24px 0;color:#111;">
            <h1 style="margin:0 0 6px;font-size:22px;line-height:1.3;">${responseEmoji} Meeting Response Received</h1>
            <p style="margin:0 0 12px;font-size:14px;color:#333;">
              <strong>${x.responderName}</strong> has 
              <span style="color:${responseColor};font-weight:600;">${x.responseType}</span> 
              your meeting invitation.
            </p>
          </td>
        </tr>

        <!-- meeting details -->
        <tr>
          <td style="padding:8px 24px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #eef0f5;border-radius:8px;">
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;width:120px;"><strong>Meeting</strong></td>
                <td style="padding:12px 14px;font-size:14px;color:#111;border-bottom:1px solid #eef0f5;font-weight:600;">${x.meetingTitle}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;"><strong>Date</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;border-bottom:1px solid #eef0f5;">${x.meetingDate}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;"><strong>Time</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;border-bottom:1px solid #eef0f5;">${x.meetingTime}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;"><strong>Response</strong></td>
                <td style="padding:12px 14px;font-size:13px;font-weight:600;" style="color:${responseColor};">${responseEmoji} ${x.responseType}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:20px 24px 4px;">
            <a href="${x.meetingUrl}" style="display:inline-block;background:#0d3b66;color:#fff;text-decoration:none;font-weight:600;border-radius:8px;padding:12px 20px;">View Meeting Details</a>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:16px 24px;background:#fafbfe;border-top:1px solid #eef0f5;color:#6b7280;font-size:12px;">
            ${x.orgName} • Meeting Management • This is an automated notification
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

// Direct Resend API call function with retry logic
async function sendViaResend(apiKey: string, from: string, to: string, subject: string, html: string) {
  const retryCount = 3;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Email] Sending attempt ${attempt}/${retryCount} to ${to}`);
      
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${apiKey}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ from, to, subject, html }),
      });

      const body = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(`RESEND ${response.status}: ${JSON.stringify(body)}`);
      }
      
      console.log(`[Email] Successfully sent to ${to}, ID: ${body?.id}`);
      return body; // includes id
    } catch (error) {
      console.error(`[Email] Attempt ${attempt}/${retryCount} failed:`, error);
      
      if (attempt === retryCount) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// Idempotency management functions
async function checkIdempotency(supabase: any, key: string): Promise<{ canProceed: boolean; cachedResult?: any }> {
  const { data: existing } = await supabase
    .from('email_events')
    .select('*')
    .eq('idempotency_key', key)
    .single();

  if (!existing) {
    return { canProceed: true };
  }

  if (existing.status === 'sent') {
    console.log(`[Idempotency] Email already sent for key: ${key}`);
    return { canProceed: false, cachedResult: { success: true, cached: true } };
  }

  if (existing.status === 'in_progress') {
    const ageMinutes = (Date.now() - new Date(existing.created_at).getTime()) / 60000;
    if (ageMinutes < 3) {
      console.log(`[Idempotency] Email in progress for key: ${key}`);
      return { canProceed: false, cachedResult: { success: false, error: 'Email in progress' } };
    }
  }

  return { canProceed: true };
}

async function markInProgress(supabase: any, key: string, payload: any) {
  await supabase
    .from('email_events')
    .upsert({
      idempotency_key: key,
      status: 'in_progress',
      payload: payload,
      last_error: null
    });
}

async function markCompleted(supabase: any, key: string, success: boolean, error?: string) {
  await supabase
    .from('email_events')
    .update({
      status: success ? 'sent' : 'failed',
      last_error: error || null
    })
    .eq('idempotency_key', key);
}

// Generate idempotency key for meeting notifications
function generateIdempotencyKey(meeting: any, type: string, participants?: any[]): string {
  const participantIds = participants?.map(p => p.id).sort().join(',') || '';
  return `${meeting.id}:${type}:${meeting.startISO}:${participantIds}`;
}

const handler = async (req: Request): Promise<Response> => {
  const CORS = cors(req);
  if (req.method === 'OPTIONS') return new Response("ok", { headers: CORS });

  try {
    console.log('[Meeting Notifications] Processing notification request...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get configuration
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("FROM_EMAIL") || "Teamtegrate Support <support@requests.teamtegrate.com>";
    const base = Deno.env.get("APP_BASE_URL") || "https://teamtegrate.com";
    const orgName = 'Teamtegrate';
    const logoUrl = 'https://teamtegrate.com/logo.png';

    // Feature flags
    const meetingEmailsEnabled = Deno.env.get("MEETING_EMAILS_ENABLED") !== 'false';
    const createdEmailsEnabled = Deno.env.get("MEETING_EMAILS_CREATED_ENABLED") !== 'false';
    const responseEmailsEnabled = Deno.env.get("MEETING_EMAILS_RESPONSE_ENABLED") !== 'false';

    if (!meetingEmailsEnabled) {
      console.log('[Feature Flag] Meeting emails disabled globally');
      return new Response(JSON.stringify({ success: false, skipped: true, reason: 'Feature disabled globally' }), { 
        status: 200, 
        headers: CORS 
      });
    }

    if (!apiKey) {
      console.error('[Config] RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ success: false, error: "Email service not configured" }), { 
        status: 500, 
        headers: CORS 
      });
    }

    const requestData: MeetingNotificationRequest = await req.json().catch(() => ({}));
    const { version, type, organizer, participants, meeting, responder } = requestData;

    console.log(`[Meeting Notifications] Processing ${type} notification for meeting ${meeting.id}`);

    // Validate payload version
    if (version !== 'v1') {
      return new Response(JSON.stringify({ success: false, error: "Unsupported payload version" }), { 
        status: 400, 
        headers: CORS 
      });
    }

    // Check feature flags for specific types
    if (type === 'created' && !createdEmailsEnabled) {
      console.log('[Feature Flag] Meeting creation emails disabled');
      return new Response(JSON.stringify({ success: false, skipped: true, reason: 'Creation emails disabled' }), { 
        status: 200, 
        headers: CORS 
      });
    }

    if (type === 'response' && !responseEmailsEnabled) {
      console.log('[Feature Flag] Meeting response emails disabled');
      return new Response(JSON.stringify({ success: false, skipped: true, reason: 'Response emails disabled' }), { 
        status: 200, 
        headers: CORS 
      });
    }

    // Generate idempotency key
    const idempotencyKey = generateIdempotencyKey(meeting, type, participants);
    
    // Check idempotency
    const { canProceed, cachedResult } = await checkIdempotency(supabase, idempotencyKey);
    if (!canProceed) {
      return new Response(JSON.stringify(cachedResult), { status: 200, headers: CORS });
    }

    // Mark as in progress
    await markInProgress(supabase, idempotencyKey, requestData);

    // Determine recipients based on type
    let recipientEmails: string[] = [];
    if (type === 'created') {
      // Send to organizer + all participants (deduped)
      const allEmails = [organizer.email, ...participants.map(p => p.email)];
      recipientEmails = [...new Set(allEmails.filter(Boolean))];
    } else if (type === 'response') {
      // Send only to organizer
      recipientEmails = [organizer.email].filter(Boolean);
    }

    if (recipientEmails.length === 0) {
      await markCompleted(supabase, idempotencyKey, false, 'No valid recipients');
      return new Response(JSON.stringify({ success: false, error: "No valid recipients" }), { 
        status: 400, 
        headers: CORS 
      });
    }

    // Format meeting details
    const meetingDate = formatDate(meeting.startISO);
    const meetingTime = formatTimeRange(meeting.startISO, meeting.endISO);
    const meetingUrl = `${base}/dashboard/meetings/${meeting.id}`;

    // Build email context
    const emailContext: MeetingEmailContext = {
      orgName,
      logoUrl,
      meetingTitle: meeting.title,
      organizerName: organizer.name || organizer.email,
      meetingDate,
      meetingTime,
      location: meeting.location,
      participantCount: participants.length,
      meetingUrl,
      notes: meeting.notes
    };

    // Handle different notification types
    let subject: string;
    let html: string;

    if (type === 'created') {
      subject = `📅 Meeting Invitation: ${meeting.title} — ${meetingDate}`;
      html = renderMeetingInvitationHTML(emailContext);
    } else if (type === 'response' && responder) {
      subject = `${responder.response === 'accepted' ? '✅' : responder.response === 'declined' ? '❌' : '⚠️'} Meeting Response: ${responder.name || 'Participant'} ${responder.response} — ${meeting.title}`;
      emailContext.responderName = responder.name || 'Unknown Participant';
      emailContext.responseType = responder.response;
      html = renderMeetingResponseHTML(emailContext);
    } else {
      await markCompleted(supabase, idempotencyKey, false, 'Unsupported notification type');
      return new Response(JSON.stringify({ success: false, error: "Unsupported notification type" }), { 
        status: 400, 
        headers: CORS 
      });
    }

    // Send emails to all recipients with fan-out
    const emailResults = await Promise.allSettled(
      recipientEmails.map(async (toEmail) => {
        const result = await sendViaResend(apiKey, from, toEmail, subject, html);
        return { to: toEmail, success: true, id: result?.id ?? null };
      })
    );

    const results = emailResults.map((r) =>
      r.status === "fulfilled" ? r.value : { to: 'unknown', success: false, error: String(r.reason) }
    );

    const successes = results.filter((r: any) => r.success).length;
    const failures = results.length - successes;

    // Mark as completed
    await markCompleted(supabase, idempotencyKey, successes > 0, failures > 0 ? `${failures} failures` : undefined);

    const response = {
      success: successes > 0,
      type,
      meeting_id: meeting.id,
      total: recipientEmails.length,
      successes,
      failures,
      results,
      idempotency_key: idempotencyKey
    };

    console.log('[Meeting Notifications] Completed processing:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: CORS,
    });

  } catch (error) {
    console.error("MEETING_NOTIFY_ERROR", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), { 
      status: 500, 
      headers: CORS 
    });
  }
};

serve(handler);