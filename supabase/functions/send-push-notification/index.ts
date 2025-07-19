
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
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

    const { user_id, title, body, data }: PushNotificationRequest = await req.json();

    // Get user's push token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('push_token, name')
      .eq('id', user_id)
      .single();

    if (userError || !user?.push_token) {
      console.log('No push token found for user:', user_id);
      return new Response(JSON.stringify({ success: false, error: 'No push token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // For now, we'll use Firebase Cloud Messaging (FCM) for both Android and iOS
    // In a production app, you'd need to set up FCM and get server keys
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    
    if (!fcmServerKey) {
      console.log('FCM server key not configured');
      return new Response(JSON.stringify({ success: false, error: 'FCM not configured' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Send push notification via FCM
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmServerKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.push_token,
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        },
        data: data || {},
        priority: 'high',
        content_available: true,
      }),
    });

    const fcmResult = await fcmResponse.json();
    
    if (fcmResponse.ok && fcmResult.success === 1) {
      console.log('Push notification sent successfully');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } else {
      console.error('FCM error:', fcmResult);
      return new Response(JSON.stringify({ success: false, error: 'FCM send failed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

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
