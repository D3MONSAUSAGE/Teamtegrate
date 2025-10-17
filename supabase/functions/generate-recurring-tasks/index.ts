import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting recurring tasks generation...');

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date/time
    const now = new Date().toISOString();
    const today = new Date().getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    console.log(`Current time: ${now}, Day of week: ${today}`);

    // Query all recurring tasks that are due for generation
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_recurring', true)
      .lte('next_due_date', now)
      .is('recurrence_parent_id', null); // Only parent tasks, not instances

    if (fetchError) {
      console.error('Error fetching recurring tasks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${tasks?.length || 0} recurring tasks to process`);

    let generatedCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    // Process each recurring task
    for (const task of tasks || []) {
      try {
        console.log(`Processing task: ${task.id} - ${task.title}`);
        
        // Parse recurrence pattern
        const pattern = task.recurrence_pattern;
        
        // Check if task should generate today based on recurrence pattern
        let shouldGenerate = false;
        
        if (pattern.frequency === 'daily') {
          shouldGenerate = true;
        } else if (pattern.frequency === 'weekly') {
          // Check if today is in the daysOfWeek array
          const daysOfWeek = pattern.daysOfWeek || [];
          shouldGenerate = daysOfWeek.includes(today);
          console.log(`Weekly task - Days: ${daysOfWeek}, Today: ${today}, Should generate: ${shouldGenerate}`);
        } else if (pattern.frequency === 'monthly') {
          // For monthly, check if it's the right day of month
          const currentDayOfMonth = new Date().getDate();
          const targetDayOfMonth = new Date(task.next_due_date).getDate();
          shouldGenerate = currentDayOfMonth === targetDayOfMonth;
        }

        if (!shouldGenerate) {
          console.log(`Skipping task ${task.id} - not scheduled for today`);
          skippedCount++;
          continue;
        }

        // Generate new occurrence using database function
        const { data: newTaskId, error: genError } = await supabase.rpc(
          'generate_recurring_task_occurrence',
          {
            parent_task_id: task.id,
            organization_id_param: task.organization_id
          }
        );

        if (genError) {
          console.error(`Error generating occurrence for task ${task.id}:`, genError);
          errors.push({ taskId: task.id, error: genError.message });
          continue;
        }

        console.log(`Generated new occurrence ${newTaskId} for task ${task.id}`);
        generatedCount++;

        // Send notification to assigned users
        const assignedUserIds = task.assigned_to_ids || (task.assigned_to_id ? [task.assigned_to_id] : []);
        
        for (const userId of assignedUserIds) {
          try {
            await supabase.from('notifications').insert({
              user_id: userId,
              organization_id: task.organization_id,
              title: 'New Recurring Task',
              content: `A new occurrence of "${task.title}" has been created`,
              type: 'task_assigned',
              task_id: newTaskId
            });
          } catch (notifError) {
            console.error(`Failed to send notification to user ${userId}:`, notifError);
          }
        }

      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
        errors.push({ taskId: task.id, error: taskError.message });
      }
    }

    const result = {
      success: true,
      generated: generatedCount,
      skipped: skippedCount,
      total: tasks?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now
    };

    console.log('Recurring tasks generation completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Fatal error in recurring tasks generation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
