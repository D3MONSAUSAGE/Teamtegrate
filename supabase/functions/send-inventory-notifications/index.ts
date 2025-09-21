import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface InventoryNotificationRequest {
  type: 'template_completed';
  count: {
    id: string;
    count_date: string;
    status: string;
    organization_id: string;
    team_id?: string;
    template_id?: string;
    template_name?: string;
    team_name?: string;
    conducted_by: string;
    completion_percentage: number;
    variance_count: number;
    total_items_count: number;
    notes?: string;
  };
  completedBy: {
    id: string;
    email: string;
    name?: string;
  };
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Inventory Notifications] Processing notification request...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: InventoryNotificationRequest = await req.json();
    const { type, count, completedBy } = requestData;

    console.log(`[Inventory Notifications] Processing ${type} for count ${count.id}`);

    let notificationsSent = 0;
    let errors = 0;

    if (type === 'template_completed') {
      // Get notification recipients
      const recipients = new Set<string>();
      
      // 1. Get team managers if count has a team_id
      if (count.team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('manager_id')
          .eq('id', count.team_id)
          .eq('organization_id', count.organization_id)
          .single();

        if (teamData?.manager_id) {
          recipients.add(teamData.manager_id);
        }
      }

      // 2. Get organization admins and superadmins
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', count.organization_id)
        .in('role', ['admin', 'superadmin']);

      if (admins) {
        admins.forEach(admin => recipients.add(admin.id));
      }

      // 3. Get template assignees if applicable
      if (count.template_id) {
        const { data: assignments } = await supabase
          .from('team_inventory_assignments')
          .select('assigned_by')
          .eq('template_id', count.template_id)
          .eq('is_active', true);

        if (assignments) {
          assignments.forEach(assignment => recipients.add(assignment.assigned_by));
        }
      }

      // Remove the person who completed the count to avoid self-notification
      recipients.delete(completedBy.id);

      console.log(`[Inventory Notifications] Found ${recipients.size} recipients for template completion`);

      // Create notifications for each recipient
      if (recipients.size > 0) {
        const notifications = Array.from(recipients).map(userId => ({
          user_id: userId,
          organization_id: count.organization_id,
          title: 'Inventory Count Completed',
          content: `${count.template_name || 'Inventory count'} has been completed${count.team_name ? ` for team ${count.team_name}` : ''} by ${completedBy.name || completedBy.email}. ${count.total_items_count} items counted with ${count.variance_count} variances (${count.completion_percentage}% complete).`,
          type: 'inventory_completed',
          metadata: {
            count_id: count.id,
            template_id: count.template_id,
            team_id: count.team_id,
            completed_by: completedBy.id,
            completion_percentage: count.completion_percentage,
            variance_count: count.variance_count,
            total_items_count: count.total_items_count,
            route: '/dashboard/inventory'
          }
        }));

        const { data: insertResult, error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (insertError) {
          console.error('[Inventory Notifications] Error creating notifications:', insertError);
          errors++;
        } else {
          notificationsSent = notifications.length;
          console.log(`[Inventory Notifications] Created ${notificationsSent} notifications successfully`);
        }
      }
    }

    const response = {
      success: true,
      type,
      count_id: count.id,
      notifications_sent: notificationsSent,
      errors,
      timestamp: new Date().toISOString()
    };

    console.log('[Inventory Notifications] Completed processing:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('[Inventory Notifications] Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
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