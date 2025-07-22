
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_id: string;
  title: string;
  content: string;
  type?: string;
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, title, content, type = 'info', metadata }: NotificationRequest = await req.json();

    // Validate user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, organization_id')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      console.log('User not found:', user_id);
      return new Response(JSON.stringify({ success: false, error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Insert notification into database (this will trigger realtime updates)
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        content,
        type,
        organization_id: user.organization_id,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to create notification' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Notification created successfully:', notification.id);
    
    // The notification will be automatically delivered via Supabase Realtime
    // to any connected clients subscribed to the user's notification channel
    
    return new Response(JSON.stringify({ 
      success: true, 
      notification_id: notification.id,
      delivery_method: 'supabase_realtime'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
