import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, direction = 'both' } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Starting bidirectional sync for user: ${userId}, direction: ${direction}`);

    const results = {
      import_result: null as any,
      export_result: null as any,
      errors: [] as string[],
    };

    // Import from Google Tasks (inbound sync)
    if (direction === 'both' || direction === 'import') {
      try {
        console.log('Starting import from Google Tasks...');
        const importResponse = await supabase.functions.invoke('import-google-tasks', {
          body: { userId },
        });

        if (importResponse.error) {
          throw new Error(`Import failed: ${importResponse.error.message}`);
        }

        results.import_result = importResponse.data;
        console.log('Import completed:', results.import_result);
      } catch (error) {
        console.error('Import error:', error);
        results.errors.push(`Import error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Export to Google Tasks (outbound sync)
    if (direction === 'both' || direction === 'export') {
      try {
        console.log('Starting export to Google Tasks...');
        
        // Get all local tasks that need to be synced
        const { data: localTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, source, google_tasks_id, last_synced_at, updated_at')
          .eq('user_id', userId)
          .neq('status', 'Completed'); // Don't sync completed tasks

        if (tasksError) {
          throw new Error(`Failed to fetch local tasks: ${tasksError.message}`);
        }

        let exportedCount = 0;
        const exportErrors: string[] = [];

        // Process each task that needs syncing
        for (const task of localTasks || []) {
          try {
            // Determine if task needs syncing
            const needsSync = 
              !task.google_tasks_id || // New task without Google ID
              !task.last_synced_at || // Never synced
              new Date(task.updated_at) > new Date(task.last_synced_at); // Updated since last sync

            if (needsSync) {
              const action = task.google_tasks_id ? 'update' : 'create';
              
              const exportResponse = await supabase.functions.invoke('export-tasks-to-google-tasks', {
                body: { taskId: task.id, action },
              });

              if (exportResponse.error) {
                exportErrors.push(`Task ${task.id}: ${exportResponse.error.message}`);
              } else {
                exportedCount++;
              }
            }
          } catch (taskError) {
            exportErrors.push(`Task ${task.id}: ${taskError instanceof Error ? taskError.message : String(taskError)}`);
          }
        }

        results.export_result = {
          processed: exportedCount,
          errors: exportErrors,
        };

        if (exportErrors.length > 0) {
          results.errors.push(...exportErrors);
        }

        console.log('Export completed:', results.export_result);
      } catch (error) {
        console.error('Export error:', error);
        results.errors.push(`Export error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Log overall sync activity
    await supabase
      .from('calendar_sync_log')
      .insert({
        user_id: userId,
        sync_type: 'bidirectional_sync',
        status: results.errors.length === 0 ? 'success' : 'partial_success',
        error_message: results.errors.length > 0 ? results.errors.join('; ') : null,
      });

    const success = results.errors.length === 0;
    console.log(`Bidirectional sync completed. Success: ${success}`);

    return new Response(JSON.stringify({ 
      success,
      results,
      summary: {
        imported: results.import_result?.inserted || 0,
        updated_from_google: results.import_result?.updated || 0,
        exported: results.export_result?.processed || 0,
        errors_count: results.errors.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-tasks-bidirectional function:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});