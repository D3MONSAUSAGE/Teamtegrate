import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QRGenerateRequest {
  tokenType: 'clock_in' | 'clock_out';
  expirationSeconds?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { tokenType, expirationSeconds = 45 }: QRGenerateRequest = await req.json();

    // Get user's organization
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('organization_id, name')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('User data error:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has an active schedule for today (for clock_in)
    if (tokenType === 'clock_in') {
      const today = new Date().toISOString().split('T')[0];
      const { data: schedules } = await supabaseClient
        .from('employee_schedules')
        .select('id, status')
        .eq('employee_id', user.id)
        .eq('scheduled_date', today)
        .eq('status', 'scheduled');

      if (!schedules || schedules.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No active schedule found for today',
            details: 'You must have a scheduled shift to clock in'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for existing active time entry (for clock_in)
    if (tokenType === 'clock_in') {
      const { data: activeEntry } = await supabaseClient
        .from('time_entries')
        .select('id')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .limit(1);

      if (activeEntry && activeEntry.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Already clocked in',
            details: 'You must clock out before generating a new clock-in QR'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for active time entry (for clock_out)
    if (tokenType === 'clock_out') {
      const { data: activeEntry } = await supabaseClient
        .from('time_entries')
        .select('id')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .limit(1);

      if (!activeEntry || activeEntry.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No active time entry',
            details: 'You must be clocked in to generate a clock-out QR'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate unique token with encryption
    const tokenPayload = {
      userId: user.id,
      userName: userData.name,
      timestamp: Date.now(),
      tokenType,
      organizationId: userData.organization_id,
      random: crypto.randomUUID()
    };

    const token = btoa(JSON.stringify(tokenPayload));
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000);

    // Store token in database
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('qr_attendance_tokens')
      .insert({
        organization_id: userData.organization_id,
        user_id: user.id,
        token,
        token_type: tokenType,
        expires_at: expiresAt.toISOString(),
        is_used: false
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`QR token generated for user ${user.id}, type: ${tokenType}, expires in ${expirationSeconds}s`);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
        tokenType,
        userName: userData.name,
        userId: user.id,
        expirationSeconds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating QR token:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});