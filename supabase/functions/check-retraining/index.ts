import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetrainingCheckRequest {
  organizationId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting retraining check...');

    // Call the database function to check and create retraining assignments
    const { data, error } = await supabaseClient.rpc('check_and_create_retraining_assignments');

    if (error) {
      console.error('Error in retraining check function:', error);
      throw error;
    }

    console.log('Retraining check completed successfully');

    // Get a summary of created assignments and notifications
    const { data: recentAssignments } = await supabaseClient
      .from('training_assignments')
      .select('id, assigned_to, content_title, due_date')
      .eq('is_retraining', true)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false });

    const { data: recentNotifications } = await supabaseClient
      .from('training_retraining_notifications')
      .select('id, user_id, course_id, notification_type')
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('sent_at', { ascending: false });

    const summary = {
      success: true,
      message: 'Retraining check completed',
      stats: {
        new_assignments_created: recentAssignments?.length || 0,
        notifications_sent: recentNotifications?.length || 0
      },
      recent_assignments: recentAssignments || [],
      recent_notifications: recentNotifications || []
    };

    console.log('Retraining check summary:', summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in retraining check:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to perform retraining check'
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