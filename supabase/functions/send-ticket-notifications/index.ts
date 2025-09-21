import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Check if API key is configured before initializing
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
    console.log("[Notification Processing] Starting", body.type, "notification for ticket", body.ticket?.id);
    console.log("[API Key Check] RESEND_API_KEY exists:", !!resendApiKey);

    if (!resend || !resendApiKey) {
      console.error("[Email Error] RESEND_API_KEY not configured or invalid");
      return new Response(JSON.stringify({ success: false, error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Use ticket_number for display, fallback to ID
    const displayTicketId = body.ticket.ticket_number || body.ticket.id;
    const brandName = Deno.env.get("BRAND_NAME") || "Teamtegrate";
    const siteUrl = Deno.env.get("SITE_URL") || "https://teamtegrate.com";

    console.log("[Ticket Info] Using ticket number:", displayTicketId);

    // Generate email template based on notification type
    const generateEmailTemplate = (type: string, data: TicketNotificationRequest) => {
      const userName = data.user?.name || data.assignee?.name || 'User';
      
      const getTypeTitle = () => {
        switch (type) {
          case 'ticket_created': return 'Ticket Created';
          case 'ticket_assigned': return 'Ticket Assigned';
          case 'ticket_updated': return 'Ticket Updated';
          case 'ticket_closed': return 'Ticket Resolved';
          default: return 'Ticket Notification';
        }
      };

      const getTypeMessage = () => {
        switch (type) {
          case 'ticket_created': return `Your support request has been received and assigned ticket number <strong>${displayTicketId}</strong>.`;
          case 'ticket_assigned': return `You have been assigned ticket <strong>${displayTicketId}</strong>.`;
          case 'ticket_updated': return `Ticket <strong>${displayTicketId}</strong> has been updated.`;
          case 'ticket_closed': return `Ticket <strong>${displayTicketId}</strong> has been resolved.`;
          default: return `This is regarding ticket <strong>${displayTicketId}</strong>.`;
        }
      };

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${getTypeTitle()} - ${brandName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .ticket-info { background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${getTypeTitle()}</h2>
              <p>Hello ${userName},</p>
              <p>${getTypeMessage()}</p>
            </div>
            
            <div class="ticket-info">
              <h3>${data.ticket.title}</h3>
              ${data.ticket.description ? `<p>${data.ticket.description}</p>` : ''}
              <p><small><strong>Status:</strong> ${data.ticket.status} | <strong>Priority:</strong> ${data.ticket.priority || 'Medium'}</small></p>
            </div>

            <a href="${siteUrl}/dashboard/requests" class="btn">View Ticket Details</a>
            
            <div class="footer">
              <p>Thank you for using ${brandName}.</p>
              <p><small>This is an automated notification. Please do not reply to this email.</small></p>
            </div>
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
          const html = generateEmailTemplate('ticket_created', body);
          console.log("[Email] Sending ticket created notification to:", body.user.email);
          const result = await resend.emails.send({
            from: `${brandName} Support <notifications@teamtegrate.com>`,
            to: [body.user.email],
            subject: `✅ Ticket ${displayTicketId} Created - ${brandName}`,
            html,
          });
          results.push({ recipient: body.user.email, result });
        }
        break;

      case 'ticket_assigned':
        if (body.assignee?.email) {
          const html = generateEmailTemplate('ticket_assigned', body);
          console.log("[Email] Sending ticket assigned notification to:", body.assignee.email);
          const result = await resend.emails.send({
            from: `${brandName} Support <notifications@teamtegrate.com>`,
            to: [body.assignee.email],
            subject: `📋 Ticket ${displayTicketId} Assigned - ${brandName}`,
            html,
          });
          results.push({ recipient: body.assignee.email, result });
        }
        break;

      case 'ticket_updated':
        if (body.user?.email) {
          const html = generateEmailTemplate('ticket_updated', body);
          console.log("[Email] Sending ticket updated notification to:", body.user.email);
          const result = await resend.emails.send({
            from: `${brandName} Support <notifications@teamtegrate.com>`,
            to: [body.user.email],
            subject: `🔄 Ticket ${displayTicketId} Updated - ${brandName}`,
            html,
          });
          results.push({ recipient: body.user.email, result });
        }
        break;

      case 'ticket_closed':
        if (body.user?.email) {
          const html = generateEmailTemplate('ticket_closed', body);
          console.log("[Email] Sending ticket closed notification to:", body.user.email);
          const result = await resend.emails.send({
            from: `${brandName} Support <notifications@teamtegrate.com>`,
            to: [body.user.email],
            subject: `✅ Ticket ${displayTicketId} Resolved - ${brandName}`,
            html,
          });
          results.push({ recipient: body.user.email, result });
        }
        break;

      default:
        console.warn(`Unknown notification type: ${body.type}`);
    }

    console.log(`[Summary] Sent ${results.length} email notifications for ${body.type} with ticket ID: ${displayTicketId}`);

    return new Response(JSON.stringify({
      success: true,
      type: body.type,
      ticket_number: displayTicketId,
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