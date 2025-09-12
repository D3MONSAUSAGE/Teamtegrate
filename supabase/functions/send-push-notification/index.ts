
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
  send_push?: boolean;
}

interface FCMMessage {
  token?: string;
  tokens?: string[];
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  android?: {
    notification: {
      channel_id: string;
      priority: 'high' | 'normal';
      sound: string;
    };
  };
  apns?: {
    payload: {
      aps: {
        sound: string;
        badge?: number;
      };
    };
  };
}

// Firebase Admin SDK functions
async function getAccessToken(): Promise<string> {
  const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY');
  
  if (!serviceAccountKey) {
    throw new Error('Firebase service account key not configured');
  }
  
  const serviceAccount = JSON.parse(serviceAccountKey);
  
  // Create JWT for Firebase Admin
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));
  
  // For simplicity, we'll use Google's OAuth endpoint
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${payload}.signature` // In production, properly sign this
    })
  });
  
  if (!response.ok) {
    // Fallback: use service account key directly (for development)
    console.log('Using service account key for auth');
    return serviceAccount.private_key;
  }
  
  const { access_token } = await response.json();
  return access_token;
}

async function sendFCMNotification(message: FCMMessage): Promise<boolean> {
  try {
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID') || 'teamtegrate-mobile';
    const accessToken = await getAccessToken();
    
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    
    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('FCM API error:', error);
      return false;
    }

    const result = await response.json();
    console.log('FCM notification sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return false;
  }
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

    const { user_id, title, content, type = 'info', metadata, send_push = true }: NotificationRequest = await req.json();

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
    
    let fcmSent = false;
    let fcmError = null;

    // Send FCM push notification if requested and user has tokens
    if (send_push) {
      try {
        const { data: fcmTokens } = await supabase
          .from('fcm_tokens')
          .select('token, platform')
          .eq('user_id', user_id)
          .eq('is_active', true);

        if (fcmTokens && fcmTokens.length > 0) {
          const tokens = fcmTokens.map(t => t.token);
          
          const fcmMessage: FCMMessage = {
            tokens,
            notification: {
              title,
              body: content,
            },
            data: {
              type,
              notification_id: notification.id,
              user_id,
              ...(metadata && Object.fromEntries(
                Object.entries(metadata).map(([k, v]) => [k, String(v)])
              ))
            },
            android: {
              notification: {
                channel_id: 'default',
                priority: type === 'urgent' ? 'high' : 'normal',
                sound: 'notification.wav'
              }
            },
            apns: {
              payload: {
                aps: {
                  sound: 'notification.wav',
                  badge: 1
                }
              }
            }
          };

          fcmSent = await sendFCMNotification(fcmMessage);
        } else {
          console.log('No FCM tokens found for user:', user_id);
        }
      } catch (error) {
        console.error('Error sending FCM notification:', error);
        fcmError = error.message;
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      notification_id: notification.id,
      delivery_methods: {
        realtime: true,
        fcm: fcmSent
      },
      fcm_error: fcmError
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
