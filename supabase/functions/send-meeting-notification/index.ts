import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MeetingNotificationRequest {
  organizerEmail: string;
  organizerName: string;
  participantName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  responseType: 'accepted' | 'declined' | 'tentative';
  location?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notificationData: MeetingNotificationRequest = await req.json();
    console.log('📧 Processing meeting notification:', notificationData);

    const { 
      organizerEmail, 
      organizerName, 
      participantName, 
      meetingTitle, 
      meetingDate, 
      meetingTime, 
      responseType, 
      location 
    } = notificationData;

    const responseTypeMap = {
      accepted: 'accepted',
      declined: 'declined',
      tentative: 'tentatively accepted'
    };

    const responseText = responseTypeMap[responseType];
    const subject = `Meeting Response: ${participantName} ${responseText} "${meetingTitle}"`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Meeting Response Update</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Someone responded to your meeting invitation</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <h2 style="color: #1e293b; font-size: 22px; margin: 0 0 20px 0;">Meeting Details</h2>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${responseType === 'accepted' ? '#10b981' : responseType === 'declined' ? '#ef4444' : '#f59e0b'};">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${responseType === 'accepted' ? '#10b981' : responseType === 'declined' ? '#ef4444' : '#f59e0b'}; margin-right: 12px;"></div>
              <strong style="color: #1e293b; font-size: 18px;">${participantName} ${responseText} your invitation</strong>
            </div>
          </div>
          
          <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0;">
            <div style="margin-bottom: 15px;">
              <strong style="color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Meeting</strong>
              <div style="color: #1e293b; font-size: 18px; font-weight: 600; margin-top: 4px;">${meetingTitle}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
              <div>
                <strong style="color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Date</strong>
                <div style="color: #1e293b; font-size: 16px; margin-top: 4px;">${meetingDate}</div>
              </div>
              <div>
                <strong style="color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Time</strong>
                <div style="color: #1e293b; font-size: 16px; margin-top: 4px;">${meetingTime}</div>
              </div>
            </div>
            
            ${location ? `
              <div>
                <strong style="color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Location</strong>
                <div style="color: #1e293b; font-size: 16px; margin-top: 4px;">${location}</div>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="background: #1e293b; color: white; padding: 20px; border-radius: 12px; text-align: center;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            This is an automated notification from your meeting management system.
          </p>
        </div>
      </div>
    `;

    console.log('📧 Sending email to:', organizerEmail);

    const emailResponse = await resend.emails.send({
      from: "Teamtegrate Meetings <meetings@resend.dev>",
      to: [organizerEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log('✅ Email sent successfully:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in send-meeting-notification function:', error);
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