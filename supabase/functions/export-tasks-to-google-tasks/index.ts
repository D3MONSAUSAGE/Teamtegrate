import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
};

interface GoogleTaskPayload {
  title: string;
  notes?: string;
  due?: string;
  status?: 'needsAction' | 'completed';
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

async function createGoogleTask(accessToken: string, taskData: GoogleTaskPayload): Promise<string> {
  const response = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create Google Task:', error);
    throw new Error('Failed to create task in Google Tasks');
  }

  const result = await response.json();
  return result.id;
}

async function updateGoogleTask(accessToken: string, taskId: string, taskData: GoogleTaskPayload): Promise<void> {
  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to update Google Task:', error);
    throw new Error('Failed to update task in Google Tasks');
  }
}

async function deleteGoogleTask(accessToken: string, taskId: string): Promise<void> {
  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    console.error('Failed to delete Google Task:', error);
    throw new Error('Failed to delete task from Google Tasks');
  }
}

function convertLocalTaskToGoogle(task: any): GoogleTaskPayload {
  const googleTask: GoogleTaskPayload = {
    title: task.title,
    notes: task.description || undefined,
    status: task.status === 'Completed' ? 'completed' : 'needsAction',
  };

  if (task.deadline) {
    // Google Tasks expects RFC 3339 date format for due dates
    const deadline = new Date(task.deadline);
    googleTask.due = deadline.toISOString().split('T')[0] + 'T00:00:00.000Z';
  }

  return googleTask;
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

    const { taskId, action = 'create' } = await req.json();

    if (!taskId) {
      throw new Error('Task ID is required');
    }

    console.log(`Processing ${action} action for task:`, taskId);

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Task not found');
    }

    // Get task owner's Google tokens
    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('google_refresh_token, google_tasks_enabled')
      .eq('id', task.user_id)
      .single();

    if (ownerError || !owner) {
      throw new Error('Task owner not found');
    }

    if (!owner.google_tasks_enabled || !owner.google_refresh_token) {
      throw new Error('Google Tasks not enabled for task owner');
    }

    // Check if task export is enabled for this user
    const { data: syncPrefs } = await supabase
      .from('google_calendar_sync_preferences')
      .select('export_to_google_tasks')
      .eq('user_id', task.user_id)
      .single();

    if (!syncPrefs?.export_to_google_tasks) {
      console.log('Google Tasks export disabled for user');
      return new Response(JSON.stringify({ success: true, message: 'Export disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Skip tasks that originated from Google Tasks (to prevent loops)
    if (task.source === 'google_tasks') {
      console.log('Skipping task that originated from Google Tasks');
      return new Response(JSON.stringify({ success: true, message: 'Skipped Google Tasks origin task' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Refresh access token
    const accessToken = await refreshGoogleToken(owner.google_refresh_token);

    // Update the access token in database
    await supabase
      .from('users')
      .update({ google_tasks_token: accessToken })
      .eq('id', task.user_id);

    let googleTaskId = task.google_tasks_id;

    if (action === 'create' || action === 'update') {
      const googleTaskData = convertLocalTaskToGoogle(task);

      if (action === 'create' && !googleTaskId) {
        // Create new Google Task
        googleTaskId = await createGoogleTask(accessToken, googleTaskData);
        
        // Update local task with Google Task ID
        await supabase
          .from('tasks')
          .update({ 
            google_tasks_id: googleTaskId,
            last_synced_at: new Date().toISOString(),
            source: task.source === 'local' ? 'hybrid' : task.source
          })
          .eq('id', taskId);

      } else if (googleTaskId) {
        // Update existing Google Task
        await updateGoogleTask(accessToken, googleTaskId, googleTaskData);
        
        // Update sync timestamp
        await supabase
          .from('tasks')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', taskId);
      }

    } else if (action === 'delete' && googleTaskId) {
      // Delete Google Task
      await deleteGoogleTask(accessToken, googleTaskId);
      
      // Clear Google Task ID from local task
      await supabase
        .from('tasks')
        .update({ 
          google_tasks_id: null,
          source: 'local',
          last_synced_at: new Date().toISOString()
        })
        .eq('id', taskId);
    }

    // Log sync activity
    await supabase
      .from('calendar_sync_log')
      .insert({
        user_id: task.user_id,
        organization_id: task.organization_id,
        sync_type: action === 'delete' ? 'delete_google_task' : 'export_to_google_tasks',
        status: 'success',
      });

    console.log(`Successfully ${action}d task in Google Tasks:`, googleTaskId);

    return new Response(JSON.stringify({ 
      success: true,
      google_task_id: googleTaskId,
      action: action,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in export-tasks-to-google-tasks function:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});