import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  updated: string;
  status: 'needsAction' | 'completed';
  position: string;
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

async function fetchGoogleTasks(accessToken: string): Promise<GoogleTask[]> {
  const response = await fetch(
    'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Google Tasks');
  }

  const data = await response.json();
  return data.items || [];
}

function convertGoogleTaskToLocal(googleTask: GoogleTask, userId: string, organizationId: string) {
  return {
    title: googleTask.title,
    description: googleTask.notes || '',
    status: googleTask.status === 'completed' ? 'Completed' : 'To Do',
    priority: 'Medium' as const,
    deadline: googleTask.due ? new Date(googleTask.due) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
    user_id: userId,
    organization_id: organizationId,
    google_tasks_id: googleTask.id,
    source: 'google_tasks' as const,
    last_synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date(googleTask.updated).toISOString(),
  };
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

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Importing Google Tasks for user:', userId);

    // Get user's Google tokens and organization
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('google_refresh_token, google_tasks_enabled, organization_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    if (!user.google_tasks_enabled || !user.google_refresh_token) {
      throw new Error('Google Tasks not enabled for user');
    }

    // Check if user has Google Tasks sync enabled
    const { data: syncPrefs } = await supabase
      .from('google_calendar_sync_preferences')
      .select('import_google_tasks')
      .eq('user_id', userId)
      .single();

    if (!syncPrefs?.import_google_tasks) {
      console.log('Google Tasks import disabled for user');
      return new Response(JSON.stringify({ success: true, message: 'Import disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Refresh access token
    const accessToken = await refreshGoogleToken(user.google_refresh_token);

    // Update the access token in database
    await supabase
      .from('users')
      .update({ google_tasks_token: accessToken })
      .eq('id', userId);

    // Fetch Google Tasks
    const googleTasks = await fetchGoogleTasks(accessToken);
    console.log(`Found ${googleTasks.length} Google Tasks`);

    // Get existing tasks with Google Task IDs to avoid duplicates
    const existingGoogleTaskIds = new Set();
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('google_tasks_id')
      .eq('user_id', userId)
      .not('google_tasks_id', 'is', null);

    if (existingTasks) {
      existingTasks.forEach(task => {
        if (task.google_tasks_id) {
          existingGoogleTaskIds.add(task.google_tasks_id);
        }
      });
    }

    // Convert and filter new tasks
    const newTasks = googleTasks
      .filter(googleTask => !existingGoogleTaskIds.has(googleTask.id))
      .map(googleTask => convertGoogleTaskToLocal(googleTask, userId, user.organization_id));

    let insertedCount = 0;
    let updatedCount = 0;

    // Insert new tasks
    if (newTasks.length > 0) {
      const { data: insertedTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(newTasks)
        .select('id');

      if (insertError) {
        console.error('Failed to insert tasks:', insertError);
        throw new Error('Failed to create tasks from Google Tasks');
      }

      insertedCount = insertedTasks?.length || 0;
    }

    // Update existing tasks that might have changed
    for (const googleTask of googleTasks.filter(task => existingGoogleTaskIds.has(task.id))) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: googleTask.title,
          description: googleTask.notes || '',
          status: googleTask.status === 'completed' ? 'Completed' : 'To Do',
          deadline: googleTask.due ? new Date(googleTask.due) : undefined,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date(googleTask.updated).toISOString(),
        })
        .eq('google_tasks_id', googleTask.id)
        .eq('user_id', userId);

      if (!updateError) {
        updatedCount++;
      }
    }

    // Log sync activity
    await supabase
      .from('calendar_sync_log')
      .insert({
        user_id: userId,
        organization_id: user.organization_id,
        sync_type: 'import_from_google_tasks',
        status: 'success',
      });

    console.log(`Successfully imported ${insertedCount} new tasks and updated ${updatedCount} existing tasks`);

    return new Response(JSON.stringify({ 
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      total_processed: insertedCount + updatedCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-google-tasks function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});