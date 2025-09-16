import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { code, userId } = await req.json();

    if (!code || !userId) {
      throw new Error('Missing authorization code or user ID');
    }

    console.log('Exchanging Google OAuth code for tokens');

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI')!,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    
    // Calculate token expiry time
    const expiresAt = Date.now() + (tokens.expires_in * 1000);

    // Store tokens in user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_calendar_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_calendar_sync_enabled: true,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to store tokens:', updateError);
      throw new Error('Failed to store Google Calendar tokens');
    }

    console.log('Successfully stored Google Calendar tokens for user:', userId);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Google Calendar connected successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-calendar-auth function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});