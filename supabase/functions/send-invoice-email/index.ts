import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendInvoiceEmailPayload {
  invoiceId: string;
  clientEmail: string;
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  companyName: string;
  companyEmail?: string;
  paymentTerms: string;
  notes?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SendInvoiceEmailPayload = await req.json();
    console.log(`[Invoice Email] Sending invoice ${payload.invoiceNumber} to ${payload.clientEmail}`);

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    // Format date
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Build line items HTML
    const lineItemsHTML = payload.lineItems.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(item.total_price)}</td>
      </tr>
    `).join('');

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h1 style="margin: 0 0 10px 0; font-size: 28px; color: #111827;">Invoice ${payload.invoiceNumber}</h1>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">From ${payload.companyName}</p>
            </td>
          </tr>

          <!-- Invoice Details -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <strong style="color: #374151;">Invoice Date:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${formatDate(payload.issueDate)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px;">
                    <strong style="color: #374151;">Due Date:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${formatDate(payload.dueDate)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px;">
                    <strong style="color: #374151;">Payment Terms:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${payload.paymentTerms}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line Items -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Description</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Rate</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsHTML}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: right; padding: 15px 0;">
                    <div style="display: inline-block; background-color: #f0fdf4; padding: 15px 25px; border-radius: 6px;">
                      <span style="font-size: 14px; color: #16a34a; font-weight: 500;">Total Amount Due</span>
                      <div style="font-size: 32px; font-weight: 700; color: #15803d; margin-top: 5px;">${formatCurrency(payload.totalAmount)}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${payload.notes ? `
          <!-- Notes -->
          <tr>
            <td style="padding: 0 40px 30px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 20px 0 5px 0; font-weight: 600; color: #374151;">Notes:</p>
              <p style="margin: 0; color: #6b7280; line-height: 1.6;">${payload.notes}</p>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                If you have any questions about this invoice, please contact us at:
              </p>
              ${payload.companyEmail ? `
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong>${payload.companyEmail}</strong>
                </p>
              ` : ''}
              <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                Thank you for your business!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Teamtegrate <notifications@requests.teamtegrate.com>",
      to: [payload.clientEmail],
      subject: `Invoice ${payload.invoiceNumber} from ${payload.companyName}`,
      html: emailHTML,
    });

    if (emailResponse.error) {
      console.error("[Invoice Email] Failed to send email:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResponse.error.message 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("[Invoice Email] Email sent successfully:", emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[Invoice Email] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
