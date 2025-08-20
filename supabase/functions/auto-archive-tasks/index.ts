import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArchiveResult {
  organizationId: string;
  archivedCount: number;
  taskIds: string[];
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('Starting automated task archiving process...');
    
    // Get all organizations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id');

    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      throw new Error(`Failed to fetch organizations: ${orgError.message}`);
    }

    const results: ArchiveResult[] = [];

    // Process each organization
    for (const org of organizations || []) {
      try {
        console.log(`Processing organization: ${org.id}`);
        
        // Get users in this organization to determine thresholds
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .eq('organization_id', org.id);

        if (usersError) {
          console.error(`Error fetching users for org ${org.id}:`, usersError);
          continue;
        }

        const archivedTaskIds: string[] = [];
        const errors: string[] = [];

        // Process each user's tasks
        for (const user of users || []) {
          try {
            // Get archive threshold for this user
            const { data: thresholdData } = await supabase
              .rpc('get_archive_threshold_days', { user_id_param: user.id });

            const thresholdDays = thresholdData || 90;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

            console.log(`Processing user ${user.id} with ${thresholdDays} day threshold`);

            // Find completed tasks older than threshold
            const { data: tasksToArchive, error: tasksError } = await supabase
              .from('tasks')
              .select('id, title, user_id, completed_at')
              .eq('organization_id', org.id)
              .eq('status', 'Completed')
              .or(`user_id.eq.${user.id},assigned_to_id.eq.${user.id}`)
              .lt('completed_at', cutoffDate.toISOString())
              .or('is_archived.is.null,is_archived.eq.false');

            if (tasksError) {
              console.error(`Error fetching tasks for user ${user.id}:`, tasksError);
              errors.push(`User ${user.id}: ${tasksError.message}`);
              continue;
            }

            // Archive the tasks
            if (tasksToArchive && tasksToArchive.length > 0) {
              const taskIds = tasksToArchive.map(t => t.id);
              
              const { error: archiveError } = await supabase
                .from('tasks')
                .update({
                  status: 'Archived',
                  is_archived: true,
                  archived_at: new Date().toISOString()
                })
                .in('id', taskIds);

              if (archiveError) {
                console.error(`Error archiving tasks for user ${user.id}:`, archiveError);
                errors.push(`User ${user.id}: ${archiveError.message}`);
              } else {
                archivedTaskIds.push(...taskIds);
                console.log(`Archived ${taskIds.length} tasks for user ${user.id}`);
              }
            }
          } catch (userError) {
            console.error(`Error processing user ${user.id}:`, userError);
            errors.push(`User ${user.id}: ${userError.message}`);
          }
        }

        results.push({
          organizationId: org.id,
          archivedCount: archivedTaskIds.length,
          taskIds: archivedTaskIds,
          errors
        });

        console.log(`Completed organization ${org.id}: archived ${archivedTaskIds.length} tasks`);

      } catch (orgError) {
        console.error(`Error processing organization ${org.id}:`, orgError);
        results.push({
          organizationId: org.id,
          archivedCount: 0,
          taskIds: [],
          errors: [orgError.message]
        });
      }
    }

    // Send summary notification (could be enhanced with email notifications)
    const totalArchived = results.reduce((sum, r) => sum + r.archivedCount, 0);
    console.log(`Archive process completed. Total tasks archived: ${totalArchived}`);

    return new Response(JSON.stringify({
      success: true,
      totalArchived,
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auto-archive function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});