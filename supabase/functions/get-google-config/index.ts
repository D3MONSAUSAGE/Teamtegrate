import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('get-google-config called from origin:', req.headers.get('origin'));
    
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    
    if (!googleClientId) {
      console.error('GOOGLE_CLIENT_ID not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Google Client ID not configured. Please contact your administrator.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const origin = req.headers.get('origin') || 'https://zlfpiovyodiyecdueiig.supabase.co';
    const redirectUri = `${origin}/auth/google/callback`;
    
    console.log('Returning Google config:', { clientId: googleClientId.substring(0, 20) + '...', redirectUri });

    return new Response(
      JSON.stringify({ 
        clientId: googleClientId,
        redirectUri
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in get-google-config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get Google configuration' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});