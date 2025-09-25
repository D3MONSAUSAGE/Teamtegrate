import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

function json(status: number, body: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, authorization, x-application-name, apikey, x-client-info, x-requested-with, accept, origin, user-agent",
      "access-control-allow-methods": "POST, OPTIONS",
      ...extra,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type, authorization, x-application-name, apikey, x-client-info, x-requested-with, accept, origin, user-agent",
        "access-control-allow-methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const { code, userId } = await req.json().catch(() => ({}));
    if (!code) return json(400, { error: "missing_auth_code" });
    if (!userId) return json(400, { error: "missing_user_id" });

    const client_id = Deno.env.get("GOOGLE_CLIENT_ID");
    const client_secret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirect_uri = Deno.env.get("GOOGLE_REDIRECT_URI");

    console.log('🔍 Environment check:', {
      GOOGLE_CLIENT_ID: !!client_id,
      GOOGLE_CLIENT_SECRET: !!client_secret,
      GOOGLE_REDIRECT_URI: !!redirect_uri,
      redirect_uri_value: redirect_uri,
      client_id_preview: client_id ? client_id.substring(0, 20) + '...' : '[MISSING]'
    });

    if (!client_id || !client_secret || !redirect_uri) {
      return json(500, {
        error: "missing_env",
        missing: {
          GOOGLE_CLIENT_ID: !!client_id,
          GOOGLE_CLIENT_SECRET: !!client_secret,
          GOOGLE_REDIRECT_URI: !!redirect_uri,
        },
      });
    }

    const body = new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri,
      grant_type: "authorization_code",
    });

    console.log('📤 Token exchange request:', {
      client_id: client_id.substring(0, 20) + '...',
      redirect_uri,
      code_length: code.length,
      grant_type: 'authorization_code'
    });

    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });

    const raw = await resp.text();
    console.log('📥 Google response:', { status: resp.status, statusText: resp.statusText, body: raw });

    if (!resp.ok) {
      return json(resp.status, { 
        error: "google_token_error", 
        raw,
        status: resp.status,
        statusText: resp.statusText
      });
    }

    const tokens = JSON.parse(raw);
    
    // Store tokens in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_calendar_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_calendar_sync_enabled: true,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Failed to store tokens:', updateError);
      return json(500, { error: "storage_error", details: updateError.message });
    }

    console.log('✅ OAuth FIXED: token exchange succeeded for user:', userId);
    return json(200, { 
      ok: true, 
      message: 'Google Calendar connected successfully',
      // Don't return actual tokens for security
      tokens_received: {
        access_token: tokens.access_token ? '[RECEIVED]' : '[MISSING]',
        refresh_token: tokens.refresh_token ? '[RECEIVED]' : '[MISSING]',
        expires_in: tokens.expires_in
      }
    });

  } catch (e) {
    console.error('❌ Server error:', e);
    return json(500, { error: "server_error", message: String((e as any)?.message ?? e) });
  }
});