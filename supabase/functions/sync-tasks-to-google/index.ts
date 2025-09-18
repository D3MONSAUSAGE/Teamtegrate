import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleCalendarTaskEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  colorId?: string;
  extendedProperties?: {
    private?: {
      taskId?: string;
      taskType?: string;
      priority?: string;
    };
  };
}

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google token');
  }

  const data = await response.json();
  return data.access_token;
}

function getTaskEventTitle(task: any, syncType: string): string {
  switch (syncType) {
    case 'deadline':
      return `📅 ${task.title} (Due)`;
    case 'focus_time':
      return `🎯 Focus Time: ${task.title}`;
    case 'reminder':
      return `⏰ ${task.title} Reminder`;
    default:
      return task.title;
  }
}

function getTaskEventDescription(task: any, syncType: string): string {
  let description = task.description || '';
  
  if (syncType === 'focus_time') {
    description = `Focus time block for working on: ${task.title}\n\n${description}`;
  } else if (syncType === 'deadline') {
    description = `Task deadline: ${task.title}\n\nPriority: ${task.priority}\n\n${description}`;
  }
  
  if (task.project_name) {
    description += `\n\nProject: ${task.project_name}`;
  }
  
  return description;
}

function getTaskColorId(priority: string): string {
  // Google Calendar color IDs
  switch (priority) {
    case 'High': return '11'; // Red
    case 'Medium': return '5'; // Yellow
    case 'Low': return '2'; // Green
    default: return '1'; // Blue (default)
  }
}

function calculateEventDuration(task: any, syncType: string): { start: Date, end: Date } {
  const deadline = new Date(task.deadline);
  
  switch (syncType) {
    case 'focus_time':
      // Create 2-hour focus blocks before the deadline
      const focusStart = new Date(deadline.getTime() - (2 * 24 * 60 * 60 * 1000)); // 2 days before
      const focusEnd = new Date(focusStart.getTime() + (2 * 60 * 60 * 1000)); // 2 hour block
      return { start: focusStart, end: focusEnd };
    
    case 'deadline':
      // 30-minute event at deadline time
      const deadlineEnd = new Date(deadline.getTime() + (30 * 60 * 1000));
      return { start: deadline, end: deadlineEnd };
    
    case 'reminder':
      // 15-minute reminder 1 hour before deadline
      const reminderStart = new Date(deadline.getTime() - (60 * 60 * 1000)); // 1 hour before
      const reminderEnd = new Date(reminderStart.getTime() + (15 * 60 * 1000)); // 15 minutes
      return { start: reminderStart, end: reminderEnd };
    
    default:
      return { start: deadline, end: new Date(deadline.getTime() + (30 * 60 * 1000)) };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { taskId, action = 'create', syncType = 'deadline' } = await req.json();

    if (!taskId) {
      throw new Error('Task ID is required');
    }

    console.log(`Processing ${action} action for task:`, taskId, 'syncType:', syncType);

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (name)
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Task not found');
    }

    // Skip completed tasks
    if (task.status === 'Completed') {
      console.log('Skipping completed task');
      return new Response(JSON.stringify({ success: true, message: 'Task completed, sync skipped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get task owner's Google tokens
    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('google_calendar_token, google_refresh_token, google_calendar_sync_enabled')
      .eq('id', task.user_id)
      .single();

    if (ownerError || !owner) {
      throw new Error('Task owner not found');
    }

    if (!owner.google_calendar_sync_enabled || !owner.google_refresh_token) {
      throw new Error('Google Calendar not connected for task owner');
    }

    // Check if task sync is enabled for this user
    const { data: syncPrefs } = await supabase
      .from('google_calendar_sync_preferences')
      .select('sync_tasks, sync_task_deadlines, sync_focus_time, sync_task_reminders')
      .eq('user_id', task.user_id)
      .single();

    const shouldSync = syncPrefs?.sync_tasks && (
      (syncType === 'deadline' && syncPrefs?.sync_task_deadlines) ||
      (syncType === 'focus_time' && syncPrefs?.sync_focus_time) ||
      (syncType === 'reminder' && syncPrefs?.sync_task_reminders)
    );

    if (!shouldSync) {
      console.log('Task sync disabled for user or sync type');
      return new Response(JSON.stringify({ success: true, message: 'Task sync disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Refresh access token
    let accessToken = owner.google_calendar_token;
    try {
      accessToken = await refreshGoogleToken(owner.google_refresh_token);
      
      // Update the access token in database
      await supabase
        .from('users')
        .update({ google_calendar_token: accessToken })
        .eq('id', task.user_id);
    } catch (tokenError) {
      console.error('Token refresh failed:', tokenError);
      throw new Error('Failed to refresh Google Calendar access');
    }

    // Handle different sync types
    let googleEventId = task[`google_event_id_${syncType}`] || task.google_event_id;

    if (action === 'create' || action === 'update') {
      const { start, end } = calculateEventDuration(task, syncType);
      
      // Prepare event data
      const eventData: GoogleCalendarTaskEvent = {
        summary: getTaskEventTitle(task, syncType),
        description: getTaskEventDescription(task, syncType),
        start: {
          dateTime: start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: 'UTC',
        },
        colorId: getTaskColorId(task.priority),
        extendedProperties: {
          private: {
            taskId: task.id,
            taskType: syncType,
            priority: task.priority,
          }
        }
      };

      let response;
      if (action === 'create' && !googleEventId) {
        // Create new event
        response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        );
      } else if (googleEventId) {
        // Update existing event
        response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          }
        );
      } else {
        throw new Error('Invalid action or missing Google event ID');
      }

      if (!response.ok) {
        const error = await response.text();
        console.error('Google Calendar API error:', error);
        throw new Error('Failed to sync task with Google Calendar');
      }

      const eventResult = await response.json();
      googleEventId = eventResult.id;

      // Update task with Google event ID for this sync type
      const updateData: any = {};
      updateData[`google_event_id_${syncType}`] = googleEventId;
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (updateError) {
        console.error('Failed to update task:', updateError);
      }

    } else if (action === 'delete' && googleEventId) {
      // Delete Google Calendar event
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        console.error('Failed to delete Google Calendar event:', error);
        throw new Error('Failed to delete task from Google Calendar');
      }

      // Clear the Google event ID for this sync type
      const updateData: any = {};
      updateData[`google_event_id_${syncType}`] = null;
      
      await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);
    }

    // Log sync activity
    await supabase
      .from('calendar_sync_log')
      .insert({
        user_id: task.user_id,
        organization_id: task.organization_id,
        sync_type: action === 'delete' ? 'delete_google' : 'export_to_google',
        google_event_id: googleEventId,
        status: 'success',
      });

    console.log(`Successfully ${action}d task ${syncType} in Google Calendar:`, googleEventId);

    return new Response(JSON.stringify({ 
      success: true,
      google_event_id: googleEventId,
      sync_type: syncType,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-tasks-to-google function:', error);
    
    // Log failed sync attempt
    try {
      const { taskId } = await req.json();
      if (taskId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('calendar_sync_log')
          .insert({
            sync_type: 'export_to_google',
            status: 'failed',
            error_message: error.message,
          });
      }
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }

    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});