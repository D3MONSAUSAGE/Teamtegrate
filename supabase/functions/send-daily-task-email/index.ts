
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

    const { user_id } = await req.json()

    if (!user_id) {
      throw new Error('User ID is required')
    }

    console.log('Generating daily email for user:', user_id)

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

    // Get daily task summary
    const { data: taskSummary, error: summaryError } = await supabaseClient
      .rpc('get_daily_task_summary', { target_user_id: user_id })

    if (summaryError) {
      console.error('Error getting task summary:', summaryError)
      throw summaryError
    }

    console.log('Task summary generated:', taskSummary)

    // Generate email HTML
    const emailHtml = generateEmailTemplate(user, taskSummary)

    // Send email using verified domain
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailResult = await sendViaResend({
      apiKey: resendApiKey,
      from: 'TaskManager <noreply@requests.teamtegrate.com>',
      to: [user.email],
      subject: `Daily Task Summary - ${new Date().toLocaleDateString()}`,
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
        message: 'Daily email sent successfully',
        email_id: emailResult.id,
        recipient: user.email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in send-daily-task-email function:', error)
    
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

function generateEmailTemplate(user: any, taskSummary: any) {
  const todayTasks = taskSummary.today_tasks || []
  const tomorrowTasks = taskSummary.tomorrow_tasks || []
  const overdueTasks = taskSummary.overdue_tasks || []

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ef4444'
      case 'Medium': return '#f59e0b'
      case 'Low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const renderTaskList = (tasks: any[], title: string, emptyMessage: string) => {
    if (tasks.length === 0) {
      return `
        <div style="margin-bottom: 32px;">
          <h2 style="color: #374151; font-size: 18px; font-weight: 600; margin-bottom: 16px;">${title}</h2>
          <p style="color: #6b7280; font-style: italic;">${emptyMessage}</p>
        </div>
      `
    }

    return `
      <div style="margin-bottom: 32px;">
        <h2 style="color: #374151; font-size: 18px; font-weight: 600; margin-bottom: 16px;">${title} (${tasks.length})</h2>
        ${tasks.map(task => `
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #fafafa;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="background: ${getPriorityColor(task.priority)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-right: 12px;">
                ${task.priority}
              </span>
              <span style="color: #6b7280; font-size: 14px;">
                ${task.project_title}
              </span>
            </div>
            <h3 style="color: #1f2937; font-size: 16px; font-weight: 500; margin-bottom: 4px;">
              ${task.title}
            </h3>
            ${task.description ? `
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
                ${task.description}
              </p>
            ` : ''}
            <div style="display: flex; align-items: center; color: #6b7280; font-size: 14px;">
              <span>Due: ${formatDate(task.deadline)} at ${formatTime(task.deadline)}</span>
              <span style="margin-left: 16px; padding: 2px 8px; background: #e5e7eb; border-radius: 4px; font-size: 12px;">
                ${task.status}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Task Summary</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Daily Task Summary</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">
            Hello ${user.name}! Here's your task overview for ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <!-- Summary Stats -->
        <div style="padding: 24px; background: #f8fafc; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-around; text-align: center;">
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #3b82f6;">${taskSummary.today_count}</div>
              <div style="font-size: 14px; color: #6b7280;">Due Today</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #10b981;">${taskSummary.tomorrow_count}</div>
              <div style="font-size: 14px; color: #6b7280;">Due Tomorrow</div>
            </div>
            <div>
              <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${taskSummary.overdue_count}</div>
              <div style="font-size: 14px; color: #6b7280;">Overdue</div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div style="padding: 24px;">
          ${renderTaskList(overdueTasks, '🚨 Overdue Tasks', 'Great! No overdue tasks.')}
          ${renderTaskList(todayTasks, '📅 Due Today', 'No tasks due today. Enjoy your day!')}
          ${renderTaskList(tomorrowTasks, '⏰ Due Tomorrow', 'Nothing scheduled for tomorrow yet.')}
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            This email was sent to you because you have daily email notifications enabled.
          </p>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
            Timezone: ${taskSummary.timezone} | Generated at ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
