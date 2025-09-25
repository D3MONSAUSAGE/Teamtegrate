import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Dynamic CORS function matching the working ticket function
function cors(req: Request) {
  const requested = req.headers.get("Access-Control-Request-Headers") ??
    "authorization, x-client-info, apikey, content-type, x-application-name, x-supabase-api-version";
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": requested,
    "Vary": "Origin, Access-Control-Request-Headers",
    "Content-Type": "application/json",
  };
}

interface TaskNotificationRequest {
  kind: 'task_assigned' | 'task_status_changed';
  to: string;
  vars?: Record<string, string>;
  // Legacy fields for backward compatibility
  task?: {
    id: string;
    title: string;
    description?: string;
    due_at?: string;
    priority?: string;
  };
  actor?: {
    id: string;
    email: string;
    name?: string;
  };
  oldStatus?: string;
  newStatus?: string;
}

// Email template loader function with retry logic and structured logging
async function loadEmailTemplate(templateName: string, variables: Record<string, string>): Promise<string> {
  const retryCount = 3;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Email Template] Loading ${templateName}, attempt ${attempt}/${retryCount}`);
      
      const templatePath = new URL(`../../../src/emails/${templateName}`, import.meta.url);
      let templateContent = await Deno.readTextFile(templatePath);
      
      // Replace template variables
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        templateContent = templateContent.replace(regex, value || '');
      }
      
      console.log(`[Email Template] Successfully loaded ${templateName}`);
      return templateContent;
    } catch (error) {
      console.error(`[Email Template] Attempt ${attempt}/${retryCount} failed for ${templateName}:`, error);
      
      if (attempt === retryCount) {
        console.error(`[Email Template] All attempts failed for ${templateName}, using fallback`);
        // Fallback to basic template
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background: hsl(217 91% 60%); color: white; padding: 20px; text-align: center; margin-bottom: 20px; border-radius: 8px;">
              <h1>${variables.brandName || 'Notification'}</h1>
            </div>
            <div style="padding: 20px;">
              <h2>Task Notification</h2>
              <p>This is a notification about task <strong>#${variables.taskId}</strong></p>
              <div style="background: hsl(240 4.8% 95.9%); padding: 15px; margin: 20px 0; border-radius: 8px;">
                <h3>${variables.taskTitle}</h3>
                ${variables.taskDescription ? `<p>${variables.taskDescription}</p>` : ''}
                ${variables.deadline ? `<p><strong>Deadline:</strong> ${variables.deadline}</p>` : ''}
                ${variables.priority ? `<p><strong>Priority:</strong> ${variables.priority}</p>` : ''}
                ${variables.oldStatus && variables.newStatus ? `<p><strong>Status:</strong> ${variables.oldStatus} → ${variables.newStatus}</p>` : ''}
              </div>
              ${variables.taskUrl ? `
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${variables.taskUrl}" style="background: hsl(217 91% 60%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Task</a>
                </div>
              ` : ''}
            </div>
            <div style="background: hsl(240 5.9% 90%); padding: 15px; text-align: center; font-size: 14px; color: hsl(240 3.8% 46.1%); border-radius: 8px;">
              ${variables.brandName || 'TeamTegrate'} Task Management
            </div>
          </div>
        `;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

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
    console.log('[Email Delivery] Sending via Resend API:', {
      to: options.to,
      subject: options.subject,
      from: options.from
    });

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
      console.error('[Email Delivery] Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        result
      });
      return {
        success: false,
        error: `Resend API error ${response.status}: ${result?.message || response.statusText}`
      };
    }

    console.log('[Email Delivery] Email sent successfully:', result?.id);
    return {
      success: true,
      id: result?.id
    };
  } catch (error) {
    console.error('[Email Delivery] Network error:', error);
    return {
      success: false,
      error: `Network error: ${error.message}`
    };
  }
}

// Enhanced notification delivery with retry logic and structured logging
async function sendEmailWithRetry(apiKey: string, fromEmail: string, emailOptions: any, context: string): Promise<boolean> {
  const retryCount = 3;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Email Delivery] Sending ${context}, attempt ${attempt}/${retryCount}`, {
        to: emailOptions.to,
        subject: emailOptions.subject
      });
      
      const result = await sendViaResend({
        apiKey,
        from: fromEmail,
        ...emailOptions
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown Resend error');
      }
      
      console.log(`[Email Delivery] Successfully sent ${context}`);
      return true;
    } catch (error) {
      console.error(`[Email Delivery] Attempt ${attempt}/${retryCount} failed for ${context}:`, error);
      
      if (attempt === retryCount) {
        console.error(`[Email Delivery] All attempts failed for ${context}`);
        return false;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  const CORS = cors(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS preflight request');
    return new Response("ok", { headers: CORS });
  }

  try {
    console.log('[Request] Processing task notification request...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[Config] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured' 
        }),
        {
          status: 500,
          headers: CORS,
        }
      );
    }

    const requestData: TaskNotificationRequest = await req.json();
    const { kind, to, vars, task, actor, oldStatus, newStatus } = requestData;

    console.log(`[Notification Processing] Starting ${kind} notification to ${to}`, { 
      kind, 
      hasVars: !!vars, 
      hasLegacyTask: !!task 
    });

    // Get configuration from environment variables
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://teamtegrate.com';
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'Teamtegrate <notifications@teamtegrate.com>';
    const brandName = 'Teamtegrate';
    const taskUrl = `${appBaseUrl}/dashboard/tasks?task=${task.id}`;

    console.log('[Config] Using configuration:', {
      appBaseUrl,
      fromEmail,
      taskUrl
    });

    let emailsSent = 0;
    let emailErrors = 0;

    // Handle different notification types
    switch (kind) {
      case 'task_assigned':
        if (to && vars) {
          // Use the new vars structure with complete template mapping
          const safeVars = {
            orgName: vars.orgName || '',
            assigneeName: vars.assigneeName || '',
            assignerName: vars.assignerName || '',
            taskTitle: vars.taskTitle || '',
            description: vars.description || '',
            priority: vars.priority || '',
            priorityClass: vars.priorityClass || '',
            dueDateLocal: vars.dueDateLocal || '',
            taskUrl: vars.taskUrl || '',
            year: vars.year || String(new Date().getFullYear()),
            manageNotificationsUrl: vars.manageNotificationsUrl || ''
          };

          console.log('[Template Variables] Using vars for task_assigned:', Object.keys(safeVars));

          const success = await sendEmailWithRetry(resendApiKey, fromEmail, {
            to,
            subject: `📋 New Task Assignment: ${safeVars.taskTitle}`,
            html: await loadEmailTemplate('task-assigned.html', safeVars)
          }, 'task assignment email');

          if (success) emailsSent++; else emailErrors++;
          console.log(`[Email Status] Task assignment email result: ${success ? 'SUCCESS' : 'FAILED'}`);
        } else if (to && task && actor) {
          // Legacy fallback for backward compatibility
          console.log('[Legacy Fallback] Using legacy task/actor structure');
          
          const formattedDeadline = task.due_at 
            ? new Date(task.due_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : '';

          const success = await sendEmailWithRetry(resendApiKey, fromEmail, {
            to,
            subject: `📋 New Task Assignment: ${task.title}`,
            html: await loadEmailTemplate('task-assigned.html', {
              assigneeName: to,
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description || '',
              priority: task.priority || 'Medium',
              deadline: formattedDeadline,
              actorName: actor.name || actor.email,
              taskUrl,
              brandName,
              orgName: brandName,
              assignerName: actor.name || actor.email,
              dueDateLocal: formattedDeadline,
              priorityClass: '',
              year: String(new Date().getFullYear()),
              manageNotificationsUrl: ''
            })
          }, 'task assignment email (legacy)');

          if (success) emailsSent++; else emailErrors++;
          console.log(`[Email Status] Task assignment email result (legacy): ${success ? 'SUCCESS' : 'FAILED'}`);
        } else {
          console.error('[Task Assignment] Missing required data:', { hasTo: !!to, hasVars: !!vars, hasTask: !!task, hasActor: !!actor });
        }
        break;

      case 'task_status_changed':
        if (to && vars) {
          // Use the new vars structure for status change
          const safeVars = {
            recipientName: vars.assigneeName || to,
            taskTitle: vars.taskTitle || '',
            oldStatus: vars.oldStatus || '',
            newStatus: vars.newStatus || '',
            actorName: vars.assignerName || '',
            taskUrl: vars.taskUrl || '',
            brandName: vars.orgName || 'TeamTegrate',
            orgName: vars.orgName || 'TeamTegrate',
            year: vars.year || String(new Date().getFullYear())
          };

          const success = await sendEmailWithRetry(resendApiKey, fromEmail, {
            to,
            subject: `🔄 Task Status Updated: ${safeVars.taskTitle}`,
            html: await loadEmailTemplate('task-status-changed.html', safeVars)
          }, 'task status update email');

          if (success) emailsSent++; else emailErrors++;
          console.log(`[Email Status] Task status update email result: ${success ? 'SUCCESS' : 'FAILED'}`);
        } else if (to && actor && oldStatus && newStatus && task) {
          // Legacy fallback for backward compatibility
          const success = await sendEmailWithRetry(resendApiKey, fromEmail, {
            to,
            subject: `🔄 Task Status Updated: ${task.title}`,
            html: await loadEmailTemplate('task-status-changed.html', {
              recipientName: to,
              taskId: task.id,
              taskTitle: task.title,
              oldStatus,
              newStatus,
              actorName: actor.name || actor.email,
              taskUrl,
              brandName,
              orgName: brandName,
              year: String(new Date().getFullYear())
            })
          }, 'task status update email (legacy)');

          if (success) emailsSent++; else emailErrors++;
          console.log(`[Email Status] Task status update email result (legacy): ${success ? 'SUCCESS' : 'FAILED'}`);
        } else {
          console.error('[Task Status Change] Missing required data:', { hasTo: !!to, hasVars: !!vars, hasTask: !!task, hasActor: !!actor });
        }
        break;

      default:
        console.warn(`[Notification Processing] Unknown notification kind: ${kind}`);
        break;
    }

    const summary = {
      emailsSent,
      emailErrors,
      totalAttempts: emailsSent + emailErrors
    };

    console.log(`[Notification Summary] Kind: ${kind}, Task: ${vars?.taskTitle || task?.id || 'unknown'}`, summary);

    return new Response(
      JSON.stringify({ 
        success: true,
        summary
      }),
      {
        status: 200,
        headers: CORS,
      }
    );
  } catch (error: any) {
    console.error('[Request] Error in send-task-notifications function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: CORS,
      }
    );
  }
};

serve(handler);