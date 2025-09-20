import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

interface TaskNotificationRequest {
  type: 'task_assigned' | 'task_reassigned' | 'task_status_changed';
  task: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    deadline?: string;
    created_at: string;
    organization_id: string;
    project_id?: string;
  };
  assignee?: {
    id: string;
    email: string;
    name?: string;
  };
  previousAssignee?: {
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
  timestamp: string;
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

// Enhanced push notification with retry logic and structured logging  
async function sendPushWithRetry(supabase: any, pushOptions: any, context: string): Promise<boolean> {
  const retryCount = 3;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[Push Delivery] Sending ${context}, attempt ${attempt}/${retryCount}`, {
        user_id: pushOptions.user_id,
        title: pushOptions.title
      });
      
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: pushOptions
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`[Push Delivery] Successfully sent ${context}`);
      return true;
    } catch (error) {
      console.error(`[Push Delivery] Attempt ${attempt}/${retryCount} failed for ${context}:`, error);
      
      if (attempt === retryCount) {
        console.error(`[Push Delivery] All attempts failed for ${context}`);
        return false;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS preflight request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const requestData: TaskNotificationRequest = await req.json();
    const { type, task, assignee, previousAssignee, actor, oldStatus, newStatus } = requestData;

    console.log(`[Notification Processing] Starting ${type} notification for task ${task.id}`);

    // Get configuration from environment variables
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://teamtegrate.com';
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'Teamtegrate <notifications@teamtegrate.com>';
    const brandName = 'Teamtegrate';
    const taskUrl = task.project_id 
      ? `${appBaseUrl}/dashboard/projects/${task.project_id}?task=${task.id}`
      : `${appBaseUrl}/dashboard/tasks?task=${task.id}`;

    console.log('[Config] Using configuration:', {
      appBaseUrl,
      fromEmail,
      taskUrl
    });

    let emailsSent = 0;
    let pushNotificationsSent = 0;
    let emailErrors = 0;
    let pushErrors = 0;

    // Format deadline for display
    const formattedDeadline = task.deadline 
      ? new Date(task.deadline).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : '';

    // Handle different notification types
    switch (type) {
      case 'task_assigned':
        if (assignee && actor) {
          // Send email to assignee
          const success = await sendEmailWithRetry(resendApiKey, fromEmail, {
            to: assignee.email,
            subject: `📋 New Task Assignment: ${task.title}`,
            html: await loadEmailTemplate('task-assigned.html', {
              assigneeName: assignee.name || assignee.email,
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description || '',
              priority: task.priority || 'Medium',
              deadline: formattedDeadline,
              actorName: actor.name || actor.email,
              taskUrl,
              brandName
            })
          }, 'task assignment email');

          if (success) emailsSent++; else emailErrors++;

          // Send push notification to assignee
          const pushSuccess = await sendPushWithRetry(supabase, {
            user_id: assignee.id,
            title: 'New Task Assignment',
            content: `${task.title} - assigned by ${actor.name || actor.email}`,
            type: 'task_assigned',
            metadata: {
              taskId: task.id,
              route: task.project_id ? `/dashboard/projects/${task.project_id}` : '/dashboard/tasks'
            },
            send_push: true
          }, 'task assignment push notification');

          if (pushSuccess) pushNotificationsSent++; else pushErrors++;
        }
        break;

      case 'task_reassigned':
        if (assignee && previousAssignee && actor) {
          // Send email to new assignee
          const newAssigneeSuccess = await sendEmailWithRetry(resendApiKey, fromEmail, {
            to: assignee.email,
            subject: `📋 Task Reassigned to You: ${task.title}`,
            html: await loadEmailTemplate('task-assigned.html', {
              assigneeName: assignee.name || assignee.email,
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description || '',
              priority: task.priority || 'Medium',
              deadline: formattedDeadline,
              actorName: actor.name || actor.email,
              taskUrl,
              brandName
            })
          }, 'task reassignment email (new assignee)');

          if (newAssigneeSuccess) emailsSent++; else emailErrors++;

          // Send email to previous assignee
          const prevAssigneeSuccess = await sendEmailWithRetry(resendApiKey, fromEmail, {
            to: previousAssignee.email,
            subject: `🔄 Task Reassigned: ${task.title}`,
            html: await loadEmailTemplate('task-reassigned.html', {
              previousAssigneeName: previousAssignee.name || previousAssignee.email,
              newAssigneeName: assignee.name || assignee.email,
              taskId: task.id,
              taskTitle: task.title,
              actorName: actor.name || actor.email,
              taskUrl,
              brandName
            })
          }, 'task reassignment email (previous assignee)');

          if (prevAssigneeSuccess) emailsSent++; else emailErrors++;

          // Send push notifications
          const newAssigneePushSuccess = await sendPushWithRetry(supabase, {
            user_id: assignee.id,
            title: 'Task Reassigned to You',
            content: `${task.title} - reassigned by ${actor.name || actor.email}`,
            type: 'task_reassigned',
            metadata: {
              taskId: task.id,
              route: task.project_id ? `/dashboard/projects/${task.project_id}` : '/dashboard/tasks'
            },
            send_push: true
          }, 'task reassignment push (new assignee)');

          if (newAssigneePushSuccess) pushNotificationsSent++; else pushErrors++;

          const prevAssigneePushSuccess = await sendPushWithRetry(supabase, {
            user_id: previousAssignee.id,
            title: 'Task Reassigned',
            content: `${task.title} has been reassigned to ${assignee.name || assignee.email}`,
            type: 'task_reassigned',
            metadata: {
              taskId: task.id,
              route: task.project_id ? `/dashboard/projects/${task.project_id}` : '/dashboard/tasks'
            },
            send_push: true
          }, 'task reassignment push (previous assignee)');

          if (prevAssigneePushSuccess) pushNotificationsSent++; else pushErrors++;
        }
        break;

      case 'task_status_changed':
        if (actor && oldStatus && newStatus) {
          // Get task creator and current assignee
          const { data: taskData } = await supabase
            .from('tasks')
            .select(`
              created_by,
              assigned_to_id,
              users_creator:users!tasks_created_by_fkey(id, email, name, push_token),
              users_assignee:users!tasks_assigned_to_id_fkey(id, email, name, push_token)
            `)
            .eq('id', task.id)
            .single();

          if (taskData) {
            const recipients = [];
            
            // Add task creator if exists
            if (taskData.users_creator && Array.isArray(taskData.users_creator) && taskData.users_creator.length > 0) {
              recipients.push(taskData.users_creator[0]);
            }
            
            // Add current assignee if exists and different from creator
            if (taskData.users_assignee && Array.isArray(taskData.users_assignee) && taskData.users_assignee.length > 0) {
              const assigneeUser = taskData.users_assignee[0];
              const creator = recipients[0];
              if (!creator || assigneeUser.id !== creator.id) {
                recipients.push(assigneeUser);
              }
            }

            for (const recipient of recipients) {
              // Send email
              const success = await sendEmailWithRetry(resendApiKey, fromEmail, {
                to: recipient.email,
                subject: `🔄 Task Status Updated: ${task.title}`,
                html: await loadEmailTemplate('task-status-changed.html', {
                  recipientName: recipient.name || recipient.email,
                  taskId: task.id,
                  taskTitle: task.title,
                  oldStatus,
                  newStatus,
                  actorName: actor.name || actor.email,
                  taskUrl,
                  brandName
                })
              }, 'task status update email');

              if (success) emailsSent++; else emailErrors++;

              // Send push notification
              if (recipient.push_token) {
                const pushSuccess = await sendPushWithRetry(supabase, {
                  user_id: recipient.id,
                  title: 'Task Status Updated',
                  content: `${task.title} is now ${newStatus}`,
                  type: 'task_status_changed',
                  metadata: {
                    taskId: task.id,
                    route: task.project_id ? `/dashboard/projects/${task.project_id}` : '/dashboard/tasks'
                  },
                  send_push: true
                }, 'task status update push notification');

                if (pushSuccess) pushNotificationsSent++; else pushErrors++;
              }
            }
          }
        }
        break;

      default:
        console.error(`[Notification Processing] Unknown notification type: ${type}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unknown notification type: ${type}` 
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
    }

    const summary = {
      emailsSent,
      pushNotificationsSent,
      emailErrors,
      pushErrors,
      totalAttempts: emailsSent + emailErrors + pushNotificationsSent + pushErrors
    };

    console.log(`[Notification Summary] Type: ${type}, Task: ${task.id}`, summary);

    return new Response(
      JSON.stringify({ 
        success: true,
        summary
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
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
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);