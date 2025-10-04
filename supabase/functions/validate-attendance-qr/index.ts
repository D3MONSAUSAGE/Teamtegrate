import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QRValidateRequest {
  token: string;
  stationId?: string;
  stationLocation?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { token, stationId, stationLocation }: QRValidateRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch token from database
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('qr_attendance_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token not found:', tokenError);
      
      // Log failed scan
      if (!tokenError || tokenError.code !== 'PGRST116') {
        await logScan(supabaseClient, null, null, stationId, 'invalid', 'Token not found');
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid QR code',
          scanStatus: 'invalid'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token already used
    if (tokenData.is_used) {
      console.log('Token already used:', tokenData.id);
      await logScan(supabaseClient, tokenData.user_id, tokenData.organization_id, stationId, 'already_used', 'QR code already scanned');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'QR code already used',
          scanStatus: 'already_used'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      console.log('Token expired:', tokenData.id);
      await logScan(supabaseClient, tokenData.user_id, tokenData.organization_id, stationId, 'expired', 'QR code expired');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'QR code expired. Please generate a new one.',
          scanStatus: 'expired'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user details
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, name, organization_id')
      .eq('id', tokenData.user_id)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      await logScan(supabaseClient, tokenData.user_id, tokenData.organization_id, stationId, 'error', 'User not found');
      
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify schedule exists for today (for clock_in)
    if (tokenData.token_type === 'clock_in') {
      const today = new Date().toISOString().split('T')[0];
      const { data: schedules } = await supabaseClient
        .from('employee_schedules')
        .select('id, status')
        .eq('employee_id', tokenData.user_id)
        .eq('scheduled_date', today)
        .eq('status', 'scheduled');

      if (!schedules || schedules.length === 0) {
        await logScan(supabaseClient, tokenData.user_id, tokenData.organization_id, stationId, 'schedule_mismatch', 'No active schedule for today');
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No scheduled shift found for today',
            scanStatus: 'schedule_mismatch'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Process clock in/out
    let timeEntryId = null;
    
    if (tokenData.token_type === 'clock_in') {
      // Create time entry
      const { data: timeEntry, error: clockInError } = await supabaseClient
        .from('time_entries')
        .insert({
          user_id: tokenData.user_id,
          organization_id: tokenData.organization_id,
          clock_in: new Date().toISOString(),
          notes: `Clocked in via QR scanner${stationLocation ? ` at ${stationLocation}` : ''}`
        })
        .select()
        .single();

      if (clockInError) {
        console.error('Clock in error:', clockInError);
        await logScan(supabaseClient, tokenData.user_id, tokenData.organization_id, stationId, 'error', clockInError.message);
        
        return new Response(
          JSON.stringify({ error: 'Failed to clock in' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      timeEntryId = timeEntry.id;
      console.log(`User ${userData.name} clocked in successfully`);
      
    } else if (tokenData.token_type === 'clock_out') {
      // Update existing time entry
      const { data: timeEntry, error: clockOutError } = await supabaseClient
        .from('time_entries')
        .update({
          clock_out: new Date().toISOString(),
          notes: supabaseClient.raw(`COALESCE(notes, '') || ' | Clocked out via QR scanner${stationLocation ? ` at ${stationLocation}` : ''}'`)
        })
        .eq('user_id', tokenData.user_id)
        .is('clock_out', null)
        .select()
        .order('clock_in', { ascending: false })
        .limit(1)
        .single();

      if (clockOutError) {
        console.error('Clock out error:', clockOutError);
        await logScan(supabaseClient, tokenData.user_id, tokenData.organization_id, stationId, 'error', clockOutError.message);
        
        return new Response(
          JSON.stringify({ error: 'Failed to clock out' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      timeEntryId = timeEntry?.id;
      console.log(`User ${userData.name} clocked out successfully`);
    }

    // Mark token as used
    await supabaseClient
      .from('qr_attendance_tokens')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        used_at_location: stationLocation || null
      })
      .eq('id', tokenData.id);

    // Log successful scan
    await logScan(
      supabaseClient, 
      tokenData.user_id, 
      tokenData.organization_id, 
      stationId, 
      'success',
      null,
      tokenData.id,
      tokenData.token_type
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: tokenData.token_type === 'clock_in' ? 'Successfully clocked in' : 'Successfully clocked out',
        userName: userData.name,
        timestamp: new Date().toISOString(),
        tokenType: tokenData.token_type,
        timeEntryId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating QR token:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function logScan(
  supabase: any,
  userId: string | null,
  organizationId: string | null,
  stationId: string | undefined,
  scanStatus: string,
  errorMessage: string | null,
  tokenId?: string,
  scanType?: string
) {
  if (!userId || !organizationId) return;

  try {
    await supabase
      .from('attendance_scan_logs')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        token_id: tokenId || null,
        station_id: stationId || null,
        scan_type: scanType || 'clock_in',
        scan_status: scanStatus,
        error_message: errorMessage,
        scanned_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log scan:', error);
  }
}