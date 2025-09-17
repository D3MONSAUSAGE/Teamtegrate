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

    console.log('🔄 Processing Google Calendar auth request');
    const { code, userId } = await req.json();

    console.log('📥 Request data:', { 
      hasCode: !!code, 
      userId, 
      codeLength: code?.length 
    });

    if (!code || !userId) {
      console.error('❌ Missing required parameters:', { hasCode: !!code, hasUserId: !!userId });
      throw new Error('Missing authorization code or user ID');
    }

    console.log('🔄 Exchanging Google OAuth code for tokens');

    // Get environment variables with detailed logging
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const googleRedirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

    console.log('🔍 Environment variables check:', {
      hasClientId: !!googleClientId,
      hasClientSecret: !!googleClientSecret,
      hasRedirectUri: !!googleRedirectUri,
      clientIdPrefix: googleClientId?.substring(0, 20),
      clientIdLength: googleClientId?.length,
      secretLength: googleClientSecret?.length,
      redirectUri: googleRedirectUri,
      allEnvVars: Object.keys(Deno.env.toObject()).filter(key => key.includes('GOOGLE'))
    });

    if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
      console.error('❌ Missing Google OAuth environment variables');
      const availableVars = Object.keys(Deno.env.toObject());
      console.error('📋 Available environment variables:', availableVars);
      throw new Error('Google OAuth configuration not found - check Supabase secrets configuration');
    }

    // Force redeployment trigger - enhanced logging version
    console.log('🚀 Google Calendar Auth v2.1 - Enhanced debugging');

    // Exchange authorization code for tokens
    const tokenParams = new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: googleRedirectUri,
    });

    console.log('📤 Token request params:', {
      client_id: googleClientId.substring(0, 20) + '...',
      redirect_uri: googleRedirectUri,
      code_length: code.length,
      grant_type: 'authorization_code'
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('📋 Parsed error:', errorJson);
      } catch (e) {
        console.error('📋 Raw error response:', errorText);
      }
      
      throw new Error(`Failed to exchange authorization code: ${errorText}`);
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