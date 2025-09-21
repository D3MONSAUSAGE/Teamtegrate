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

// Template loading function
async function loadEmailTemplate(templateName: string): Promise<string> {
  try {
    const response = await fetch(`https://raw.githubusercontent.com/teamtegrate/teamtegrate/main/src/emails/${templateName}`);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.warn(`Failed to load template ${templateName}:`, error);
    // Return fallback template
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>{{subject}}</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>📦 Inventory Count Submitted</h2>
        <p><strong>Submitted by:</strong> {{submitterName}}</p>
        <p><strong>Team:</strong> {{teamName}}</p>
        <p><strong>Date:</strong> {{submissionDate}} at {{submissionTime}}</p>
        <p><strong>Total items:</strong> {{totalItems}}</p>
        <div style="margin: 20px 0;">
          <a href="{{reviewUrl}}" style="background: hsl(217 91% 60%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">🔍 View Full Inventory Report</a>
        </div>
        <p style="color: #666; font-size: 14px;">This is an automated message from {{companyName}} – Inventory Management.</p>
      </body>
      </html>
    `;
  }
}

// Template processing function
function processTemplate(template: string, variables: Record<string, any>): string {
  let processed = template;
  
  // Handle simple variable replacements
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, String(value || ''));
  });
  
  // Handle conditional sections for showLowItemWarning
  if (variables.showLowItemWarning) {
    processed = processed.replace(/{{#showLowItemWarning}}([\s\S]*?){{\/showLowItemWarning}}/g, '$1');
  } else {
    processed = processed.replace(/{{#showLowItemWarning}}[\s\S]*?{{\/showLowItemWarning}}/g, '');
  }
  
  // Handle itemPreview conditional sections
  if (variables.itemPreview && variables.itemPreview.items && variables.itemPreview.items.length > 0) {
    processed = processed.replace(/{{#itemPreview}}([\s\S]*?){{\/itemPreview}}/g, '$1');
    
    // Process items list
    const itemsSection = processed.match(/{{#items}}([\s\S]*?){{\/items}}/);
    if (itemsSection) {
      const itemTemplate = itemsSection[1];
      const itemsHtml = variables.itemPreview.items.map((item: any) => {
        return itemTemplate
          .replace(/{{name}}/g, item.name || '')
          .replace(/{{quantity}}/g, item.quantity || '')
          .replace(/{{unit}}/g, item.unit || '');
      }).join('');
      processed = processed.replace(/{{#items}}[\s\S]*?{{\/items}}/, itemsHtml);
    }
    
    // Handle hasMoreItems conditional
    if (variables.itemPreview.hasMoreItems) {
      processed = processed.replace(/{{#hasMoreItems}}([\s\S]*?){{\/hasMoreItems}}/g, '$1');
      processed = processed.replace(/{{remainingCount}}/g, String(variables.itemPreview.remainingCount || ''));
    } else {
      processed = processed.replace(/{{#hasMoreItems}}[\s\S]*?{{\/hasMoreItems}}/g, '');
    }
  } else {
    processed = processed.replace(/{{#itemPreview}}[\s\S]*?{{\/itemPreview}}/g, '');
  }
  
  return processed;
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
      
      // Enhanced subject line
      const subject = `📦 Inventory Count – ${submitterName} – ${teamName} – ${submissionDate}`;
      const url = `${base}/dashboard/inventory`;

      // Fetch inventory items for preview (first 5 items)
      let itemPreview = null;
      try {
        const { data: items } = await supabase
          .from('inventory_count_items')
          .select('item_name, counted_quantity, unit')
          .eq('count_id', inv.id)
          .limit(5);

        if (items && items.length > 0) {
          const previewItems = items.map(item => ({
            name: item.item_name || 'Unknown Item',
            quantity: item.counted_quantity || 0,
            unit: item.unit || 'units'
          }));

          // Check if there are more items
          const { count: totalItemsCount } = await supabase
            .from('inventory_count_items')
            .select('*', { count: 'exact', head: true })
            .eq('count_id', inv.id);

          const hasMoreItems = (totalItemsCount || 0) > 5;
          const remainingCount = Math.max(0, (totalItemsCount || 0) - 5);

          itemPreview = {
            items: previewItems,
            hasMoreItems,
            remainingCount
          };
        }
      } catch (error) {
        console.warn('Failed to fetch inventory items for preview:', error);
      }

      // Load and process email template
      const template = await loadEmailTemplate('inventory-submitted.html');
      const templateVariables = {
        companyName: 'Teamtegrate',
        submitterName,
        teamName,
        submissionDate,
        submissionTime,
        totalItems: `${totalItems}`,
        reviewUrl: url,
        showLowItemWarning: totalItems < 5,
        itemPreview
      };

      const html = processTemplate(template, templateVariables);

      const sends = await Promise.allSettled(
        recipientList.map(async (toEmail) => {
          const out = await sendViaResend(apiKey, from, toEmail, subject, html);
          return { to: toEmail, ok: true, id: out?.id ?? null };
        })
      );

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