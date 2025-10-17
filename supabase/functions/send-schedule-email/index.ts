import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name, x-schema-version, x-postgrest-profile',
}

const resendApiKey = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, week_start, week_end } = await req.json()

    if (!user_id || !week_start || !week_end) {
      throw new Error('User ID, week_start, and week_end are required')
    }

    console.log('Generating schedule email for user:', user_id, 'week:', week_start, '-', week_end)

    // Get user info
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('name, email, timezone, organization_id')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      console.error('User not found error:', userError)
      throw new Error('User not found')
    }

    console.log('User found:', { name: user.name, email: user.email, timezone: user.timezone })

    // Fetch employee schedules for this week
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from('employee_schedules')
      .select(`
        id,
        scheduled_date,
        scheduled_start_time,
        scheduled_end_time,
        area,
        notes,
        shift_name
      `)
      .eq('employee_id', user_id)
      .gte('scheduled_date', week_start)
      .lte('scheduled_date', week_end)
      .order('scheduled_date', { ascending: true })

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError)
      throw schedulesError
    }

    console.log('Schedules found:', schedules?.length || 0)

    // Generate email HTML
    const emailHtml = generateScheduleEmailTemplate(user, schedules || [], week_start, week_end)

    // Send email using verified domain
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailResult = await sendViaResend({
      apiKey: resendApiKey,
      from: 'Schedule Manager <noreply@teamtegrate.com>',
      to: [user.email],
      subject: `Your Schedule for ${new Date(week_start).toLocaleDateString()} - ${new Date(week_end).toLocaleDateString()}`,
      html: emailHtml
    });

    if (!emailResult.success) {
      console.error('Error sending email:', emailResult.error);
      throw new Error(emailResult.error || 'Email send failed');
    }

    console.log('Email sent successfully:', emailResult.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Schedule email sent successfully',
        email_id: emailResult.id,
        recipient: user.email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in send-schedule-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function generateScheduleEmailTemplate(user: any, schedules: any[], week_start: string, week_end: string) {
  // Calculate total hours
  let totalHours = 0;
  schedules.forEach(schedule => {
    const start = new Date(schedule.scheduled_start_time);
    const end = new Date(schedule.scheduled_end_time);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    totalHours += hours;
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Weekly Schedule</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Your Weekly Schedule</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">
            ${new Date(week_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
            ${new Date(week_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        
        <!-- Summary Stats -->
        <div style="padding: 24px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: #3b82f6;">${totalHours.toFixed(1)} hours</div>
          <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Total scheduled this week</div>
          <div style="margin-top: 8px; font-size: 14px; color: #6b7280;">${schedules.length} shifts</div>
        </div>
        
        <!-- Schedule Details -->
        <div style="padding: 24px;">
          <h2 style="color: #374151; font-size: 18px; font-weight: 600; margin-bottom: 16px;">Your Shifts</h2>
          
          ${schedules.length === 0 ? `
            <p style="color: #6b7280; font-style: italic; text-align: center; padding: 32px 0;">
              No shifts scheduled for this week.
            </p>
          ` : schedules.map(schedule => {
            const date = new Date(schedule.scheduled_date);
            const startTime = new Date(schedule.scheduled_start_time);
            const endTime = new Date(schedule.scheduled_end_time);
            const duration = ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(1);
            
            return `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #fafafa;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <div style="font-weight: 600; color: #1f2937; font-size: 16px;">
                    ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                  <div style="color: #6b7280; font-size: 14px;">${duration} hours</div>
                </div>
                
                <div style="color: #374151; font-size: 15px; margin-bottom: 4px;">
                  🕐 ${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                  ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
                
                ${schedule.area ? `
                  <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">
                    📍 ${schedule.area.charAt(0).toUpperCase() + schedule.area.slice(1).replace('_', ' ')}
                  </div>
                ` : ''}
                
                ${schedule.notes ? `
                  <div style="color: #6b7280; font-size: 14px; margin-top: 8px; padding: 8px; background: white; border-radius: 4px;">
                    💬 ${schedule.notes}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            This is your official schedule. Please contact your manager if you have any questions.
          </p>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
            Generated at ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
