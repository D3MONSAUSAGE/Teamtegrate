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

    console.log('Processing pending calendar sync operations...');

    // Get all pending sync operations from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: pendingSyncs, error: syncError } = await supabase
      .from('calendar_sync_log')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: true })
      .limit(50); // Process up to 50 at a time to avoid timeouts

    if (syncError) {
      throw new Error('Failed to fetch pending syncs: ' + syncError.message);
    }

    if (!pendingSyncs || pendingSyncs.length === 0) {
      console.log('No pending sync operations found');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'No pending operations',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingSyncs.length} pending sync operations`);

    let processedCount = 0;
    let errorCount = 0;

    for (const sync of pendingSyncs) {
      try {
        console.log(`Processing sync operation: ${sync.sync_type} for meeting: ${sync.meeting_request_id}`);

        // Call the appropriate sync function based on sync type
        if (sync.sync_type.includes('google')) {
          // Process Google Calendar sync operations
          const { data, error } = await supabase.functions.invoke('sync-meeting-to-google', {
            body: { 
              meetingId: sync.meeting_request_id,
              action: sync.sync_type === 'delete_google' ? 'delete' : 
                      sync.sync_type === 'update_google' ? 'update' : 'create'
            }
          });

          if (error) {
            throw new Error(`Sync function error: ${error.message}`);
          }

          // Update sync log status to success
          await supabase
            .from('calendar_sync_log')
            .update({ 
              status: 'success',
              updated_at: new Date().toISOString()
            })
            .eq('id', sync.id);

          console.log(`Successfully processed sync operation: ${sync.id}`);
          processedCount++;

        } else {
          // Handle other sync types (future expansion)
          console.log(`Skipping unsupported sync type: ${sync.sync_type}`);
          await supabase
            .from('calendar_sync_log')
            .update({ 
              status: 'failed',
              error_message: 'Unsupported sync type',
              updated_at: new Date().toISOString()
            })
            .eq('id', sync.id);
          errorCount++;
        }

      } catch (syncProcessError) {
        console.error(`Error processing sync operation ${sync.id}:`, syncProcessError);
        errorCount++;

        // Update sync log status to failed
        await supabase
          .from('calendar_sync_log')
          .update({ 
            status: 'failed',
            error_message: syncProcessError instanceof Error ? syncProcessError.message : String(syncProcessError),
            updated_at: new Date().toISOString()
          })
          .eq('id', sync.id);
      }
    }

    // Clean up old completed sync logs (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('calendar_sync_log')
      .delete()
      .lt('created_at', sevenDaysAgo)
      .in('status', ['success', 'failed']);

    console.log(`Sync queue processing complete: ${processedCount} processed, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      success: true,
      processed: processedCount,
      errors: errorCount,
      total: pendingSyncs.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-calendar-sync-queue function:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});