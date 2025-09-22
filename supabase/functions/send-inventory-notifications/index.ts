import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Dynamic CORS function matching ticket notifications pattern
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

interface InventoryNotificationRequest {
  type: 'template_completed' | 'inventory_count_submitted';
  kind?: 'inventory_count_submitted'; // Alternative field name for consistency
  count?: {
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
  };
  inventory?: {
    id: string;
    team_name?: string;
    team_id?: string;
    items_total?: number;
    submitted_by_name?: string;
    location_name?: string;
  };
  completedBy?: {
    id: string;
    email: string;
    name?: string;
  };
  recipients?: string[];
  to?: string;
  timestamp: string;
}

interface InventoryEmailContext {
  orgName: string;
  logoUrl: string;
  submittedBy: string;
  teamName: string;
  submittedDate: string;
  totalItems: number;
  countUrl: string;
  highlights?: { name: string; expected: string|number; counted: string|number; delta: string|number; }[];
}

// Enhanced HTML escaping function
function esc(s?: string) {
  return (s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]!));
}

// Professional inventory email template renderer
function renderInventorySubmittedHTML(ctx: InventoryEmailContext): string {
  const x = {
    ...ctx,
    orgName: esc(ctx.orgName),
    submittedBy: esc(ctx.submittedBy),
    teamName: esc(ctx.teamName),
  };

  return `<!-- preview text (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;">
  Your inventory count was submitted and is ready for review.
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
              <td align="right" style="font-size:12px;opacity:.9;">Inventory</td>
            </tr></table>
          </td>
        </tr>

        <!-- title -->
        <tr>
          <td style="padding:28px 24px 0;color:#111;">
            <h1 style="margin:0 0 6px;font-size:22px;line-height:1.3;">📦 Inventory Count Submitted</h1>
            <p style="margin:0 0 12px;font-size:14px;color:#333;">
              A new inventory count has been submitted and is ready for review.
            </p>
          </td>
        </tr>

        <!-- facts -->
        <tr>
          <td style="padding:8px 24px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #eef0f5;border-radius:8px;">
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;width:160px;"><strong>Submitted by</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;border-bottom:1px solid #eef0f5;">${x.submittedBy}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;"><strong>Team</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;border-bottom:1px solid #eef0f5;">${x.teamName}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;border-bottom:1px solid #eef0f5;"><strong>Date</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;border-bottom:1px solid #eef0f5;">${x.submittedDate}</td>
              </tr>
              <tr>
                <td style="padding:12px 14px;font-size:13px;color:#555;"><strong>Total items</strong></td>
                <td style="padding:12px 14px;font-size:13px;color:#111;">${x.totalItems}</td>
              </tr>
            </table>
          </td>
        </tr>

        ${ctx.highlights && ctx.highlights.length > 0 ? `
        <!-- optional highlights -->
        <tr>
          <td style="padding:18px 24px 0;">
            <h3 style="margin:0 0 8px;font-size:14px;color:#111;">Top variances</h3>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #eef0f5;border-radius:8px;">
              <tr>
                <td style="padding:10px 12px;font-size:12px;color:#555;"><strong>Item</strong></td>
                <td style="padding:10px 12px;font-size:12px;color:#555;"><strong>Expected</strong></td>
                <td style="padding:10px 12px;font-size:12px;color:#555;"><strong>Counted</strong></td>
                <td style="padding:10px 12px;font-size:12px;color:#555;"><strong>Δ</strong></td>
              </tr>
              ${ctx.highlights.map(item => `
              <tr>
                <td style="padding:10px 12px;font-size:12px;color:#111;border-top:1px solid #eef0f5;">${esc(String(item.name))}</td>
                <td style="padding:10px 12px;font-size:12px;color:#111;border-top:1px solid #eef0f5;">${esc(String(item.expected))}</td>
                <td style="padding:10px 12px;font-size:12px;color:#111;border-top:1px solid #eef0f5;">${esc(String(item.counted))}</td>
                <td style="padding:10px 12px;font-size:12px;color:#111;border-top:1px solid #eef0f5;">${esc(String(item.delta))}</td>
              </tr>
              `).join('')}
            </table>
          </td>
        </tr>
        ` : ''}

        <!-- CTA -->
        <tr>
          <td style="padding:20px 24px 4px;">
            <a href="${x.countUrl}" style="display:inline-block;background:#0d3b66;color:#fff;text-decoration:none;font-weight:600;border-radius:8px;padding:10px 16px;">Review count</a>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:16px 24px;background:#fafbfe;border-top:1px solid #eef0f5;color:#6b7280;font-size:12px;">
            This is an automated message from Teamtegrate — Inventory Management.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

// Date formatting functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
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

// Direct Resend API call function
async function sendViaResend(apiKey: string, from: string, to: string, subject: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`RESEND ${r.status}: ${JSON.stringify(body)}`);
  return body; // includes id
}

const handler = async (req: Request): Promise<Response> => {
  const CORS = cors(req);
  if (req.method === 'OPTIONS') return new Response("ok", { headers: CORS });

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("FROM_EMAIL") || "Teamtegrate Support <support@requests.teamtegrate.com>";
    const base = Deno.env.get("APP_BASE_URL") || "https://teamtegrate.com";

    console.log('[Inventory Notifications] Processing notification request...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: InventoryNotificationRequest = await req.json().catch(() => ({}));
    const { type, kind, count, inventory, completedBy, recipients, to } = requestData;

    // Handle new email notification type
    if (kind === 'inventory_count_submitted' || type === 'inventory_count_submitted') {
      if (!apiKey) return new Response(JSON.stringify({ ok: false, error: "missing_resend_key" }), { status: 500, headers: CORS });

      // Accept either {to:"a@x.com"} or {recipients:["a@x.com","b@y.com"]}
      let recipientList: string[] = [];
      if (Array.isArray(recipients)) recipientList = recipients.filter(Boolean);
      if (to && typeof to === "string") recipientList.push(to);
      recipientList = [...new Set(recipientList.map((e: string) => e?.trim()?.toLowerCase()).filter(Boolean))];
      
      if (recipientList.length === 0) {
        return new Response(JSON.stringify({ ok: false, error: "missing_recipients" }), { status: 400, headers: CORS });
      }

      const inv = inventory ?? {};
      const submitterName = inv.submitted_by_name || 'Unknown User';
      const teamName = inv.team_name || inv.location_name || 'N/A';
      const totalItems = inv.items_total || 0;
      const submissionDate = formatDate(requestData.timestamp);
      const submissionTime = formatTime(requestData.timestamp);
      
      // Enhanced subject line with preheader
      const subject = `📦 Inventory Count Submitted — ${submitterName} — ${teamName} — ${submissionDate}`;
      const url = `${base}/dashboard/inventory`;

      // Fetch inventory items for variance highlights (top 5 with variances)
      let highlights = null;
      try {
        const { data: items } = await supabase
          .from('inventory_count_items')
          .select('item_name, counted_quantity, expected_quantity, unit')
          .eq('count_id', inv.id)
          .neq('counted_quantity', 'expected_quantity')
          .order('abs(counted_quantity - expected_quantity)', { ascending: false })
          .limit(5);

        if (items && items.length > 0) {
          highlights = items.map(item => ({
            name: item.item_name || 'Unknown Item',
            expected: item.expected_quantity || 0,
            counted: item.counted_quantity || 0,
            delta: (item.counted_quantity || 0) - (item.expected_quantity || 0)
          }));
        }
      } catch (error) {
        console.warn('Failed to fetch inventory variance highlights:', error);
      }

      // Render professional email template
      const emailContext: InventoryEmailContext = {
        orgName: 'Teamtegrate',
        logoUrl: 'https://teamtegrate.com/logo.png', // Placeholder - replace with actual logo URL
        submittedBy: submitterName,
        teamName,
        submittedDate: `${submissionDate} at ${submissionTime}`,
        totalItems,
        countUrl: url,
        highlights: highlights || undefined
      };

      const html = renderInventorySubmittedHTML(emailContext);

      // Sequential sending with rate limiting to avoid Resend 429s
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
      const RATE_MS = 600;       // under Resend 2 req/sec (safe margin)
      const MAX_RETRIES = 2;     // small backoff on 429s

      const results: Array<{to:string; ok:boolean; id?:string|null; error?:string}> = [];

      for (let i = 0; i < recipientList.length; i++) {
        const to = recipientList[i];

        if (i > 0) await sleep(RATE_MS); // throttle

        let attempt = 0;
        let ok = false;
        let lastErr: any = null;
        let messageId: string | null = null;

        while (attempt <= MAX_RETRIES && !ok) {
          try {
            const out = await sendViaResend(apiKey, from, to, subject, html);
            messageId = out?.id ?? null;
            ok = true;
          } catch (e: any) {
            lastErr = e;
            const status = e?.status ?? e?.response?.status ?? '';
            if (String(status) === '429') {
              await sleep(RATE_MS * (attempt + 1)); // simple backoff
              attempt++;
            } else {
              break; // non-429 error: do not retry
            }
          }
        }

        results.push({ to, ok, id: messageId, error: ok ? undefined : String(lastErr) });
        console.log('INV_EMAIL_SEND', { to, ok, id: messageId, attempt, error: ok ? null : String(lastErr) });
      }

      const sends = results;

      const results = sends.map((r) =>
        r.status === "fulfilled" ? r.value : { ok: false, error: String(r.reason) }
      );
      const sent = results.filter((r: any) => r.ok).length;

      console.log("INVENTORY_EMAIL_RESULTS", { inventory_id: inv.id, team_id: inv.team_id, sent, total: recipientList.length, results });
      return new Response(JSON.stringify({ ok: sent > 0, sent, total: recipientList.length, results }), { status: 200, headers: CORS });
    }

    // Handle existing in-app notification type (template_completed)
    console.log(`[Inventory Notifications] Processing ${type} for count ${count?.id}`);

    let notificationsSent = 0;
    let errors = 0;

    if (type === 'template_completed' && count) {
      // Get notification recipients
      const recipients = new Set<string>();
      
      // 1. Get team managers if count has a team_id
      if (count.team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('manager_id')
          .eq('id', count.team_id)
          .eq('organization_id', count.organization_id)
          .single();

        if (teamData?.manager_id) {
          recipients.add(teamData.manager_id);
        }
      }

      // 2. Get organization admins and superadmins
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', count.organization_id)
        .in('role', ['admin', 'superadmin']);

      if (admins) {
        admins.forEach(admin => recipients.add(admin.id));
      }

      // 3. Get template assignees if applicable
      if (count.template_id) {
        const { data: assignments } = await supabase
          .from('team_inventory_assignments')
          .select('assigned_by')
          .eq('template_id', count.template_id)
          .eq('is_active', true);

        if (assignments) {
          assignments.forEach(assignment => recipients.add(assignment.assigned_by));
        }
      }

      // Remove the person who completed the count to avoid self-notification
      recipients.delete(completedBy.id);

      console.log(`[Inventory Notifications] Found ${recipients.size} recipients for template completion`);

      // Create notifications for each recipient
      if (recipients.size > 0) {
        const notifications = Array.from(recipients).map(userId => ({
          user_id: userId,
          organization_id: count.organization_id,
          title: 'Inventory Count Completed',
          content: `${count.template_name || 'Inventory count'} has been completed${count.team_name ? ` for team ${count.team_name}` : ''} by ${completedBy.name || completedBy.email}. ${count.total_items_count} items counted with ${count.variance_count} variances (${count.completion_percentage}% complete).`,
          type: 'inventory_completed',
          metadata: {
            count_id: count.id,
            template_id: count.template_id,
            team_id: count.team_id,
            completed_by: completedBy.id,
            completion_percentage: count.completion_percentage,
            variance_count: count.variance_count,
            total_items_count: count.total_items_count,
            route: '/dashboard/inventory'
          }
        }));

        const { data: insertResult, error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (insertError) {
          console.error('[Inventory Notifications] Error creating notifications:', insertError);
          errors++;
        } else {
          notificationsSent = notifications.length;
          console.log(`[Inventory Notifications] Created ${notificationsSent} notifications successfully`);
        }
      }
    }

    const response = {
      success: true,
      type,
      count_id: count.id,
      notifications_sent: notificationsSent,
      errors,
      timestamp: new Date().toISOString()
    };

    console.log('[Inventory Notifications] Completed processing:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: CORS,
    });

  } catch (error) {
    console.error("INVENTORY_NOTIFY_ERROR", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500, headers: CORS });
  }
};

serve(handler);