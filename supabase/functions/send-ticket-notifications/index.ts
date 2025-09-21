import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketNotificationRequest {
  type: string;
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TicketNotificationRequest = await req.json();
    console.log("Received ticket notification request:", body.type, body.ticket?.id);

    if (!resend) {
      console.warn("RESEND_API_KEY not configured, skipping email notification");
      return new Response(JSON.stringify({ success: false, error: "Email service not configured" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Load email template from file system and replace variables
    const loadTemplate = async (templateName: string) => {
      try {
        const templatePath = `./src/emails/${templateName}.html`;
        const templateContent = await Deno.readTextFile(templatePath);
        
        // Replace template variables
        return templateContent
          .replace(/\{\{ticketId\}\}/g, body.ticket.ticket_number || body.ticket.id)
          .replace(/\{\{ticketTitle\}\}/g, body.ticket.title)
          .replace(/\{\{ticketDescription\}\}/g, body.ticket.description || '')
          .replace(/\{\{userName\}\}/g, body.user?.name || body.assignee?.name || 'User')
          .replace(/\{\{brandName\}\}/g, Deno.env.get("BRAND_NAME") || "Teamtegrate")
          .replace(/\{\{ticketUrl\}\}/g, `${Deno.env.get("SITE_URL") || "http://localhost:3000"}/dashboard/requests`);
      } catch (error) {
        console.warn(`Template ${templateName} not found, using fallback`);
        return getFallbackTemplate(body.type, body);
      }
    };

    // Fallback template generator
    const getFallbackTemplate = (type: string, data: TicketNotificationRequest) => {
      const ticketId = data.ticket.ticket_number || data.ticket.id;
      const userName = data.user?.name || data.assignee?.name || 'User';
      const brandName = Deno.env.get("BRAND_NAME") || "Teamtegrate";
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Ticket ${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
            <p>Hello ${userName},</p>
            <p>This is regarding ticket <strong>${ticketId}</strong>:</p>
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>${data.ticket.title}</h3>
              ${data.ticket.description ? `<p>${data.ticket.description}</p>` : ''}
              <p><small>Status: ${data.ticket.status} | Priority: ${data.ticket.priority || 'Medium'}</small></p>
            </div>
            <p>Thank you,<br>${brandName} Team</p>
          </div>
        </body>
        </html>
      `;
    };

    const results = [];

    // Determine recipients and email content based on notification type
    switch (body.type) {
      case 'ticket_created':
        if (body.user?.email) {
          const html = await loadTemplate('ticket-created-user');
          const result = await resend.emails.send({
            from: `${Deno.env.get("BRAND_NAME") || "Teamtegrate"} <notifications@teamtegrate.com>`,
            to: [body.user.email],
            subject: `Ticket Created: ${body.ticket.ticket_number || body.ticket.id}`,
            html,
          });
          results.push({ recipient: body.user.email, result });
        }
        break;

      case 'ticket_assigned':
        if (body.assignee?.email) {
          const html = await loadTemplate('ticket-assigned');
          const result = await resend.emails.send({
            from: `${Deno.env.get("BRAND_NAME") || "Teamtegrate"} <notifications@teamtegrate.com>`,
            to: [body.assignee.email],
            subject: `Ticket Assigned: ${body.ticket.ticket_number || body.ticket.id}`,
            html,
          });
          results.push({ recipient: body.assignee.email, result });
        }
        break;

      case 'ticket_updated':
        if (body.user?.email) {
          const html = await loadTemplate('ticket-updated');
          const result = await resend.emails.send({
            from: `${Deno.env.get("BRAND_NAME") || "Teamtegrate"} <notifications@teamtegrate.com>`,
            to: [body.user.email],
            subject: `Ticket Updated: ${body.ticket.ticket_number || body.ticket.id}`,
            html,
          });
          results.push({ recipient: body.user.email, result });
        }
        break;

      case 'ticket_closed':
        if (body.user?.email) {
          const html = await loadTemplate('ticket-closed');
          const result = await resend.emails.send({
            from: `${Deno.env.get("BRAND_NAME") || "Teamtegrate"} <notifications@teamtegrate.com>`,
            to: [body.user.email],
            subject: `Ticket Resolved: ${body.ticket.ticket_number || body.ticket.id}`,
            html,
          });
          results.push({ recipient: body.user.email, result });
        }
        break;

      default:
        console.warn(`Unknown notification type: ${body.type}`);
    }

    console.log(`Sent ${results.length} email notifications for ${body.type}`);

    return new Response(JSON.stringify({
      success: true,
      type: body.type,
      sent: results.length,
      results: results.map(r => ({ recipient: r.recipient, success: !r.result.error }))
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-ticket-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);