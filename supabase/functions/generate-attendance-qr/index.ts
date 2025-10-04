import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
};

interface QRGenerateRequest {
  tokenType: 'clock_in' | 'clock_out';
  expirationSeconds?: number;
  targetUserId?: string; // For manager-assisted clock-in
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // User client for authentication and data retrieval
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { tokenType, expirationSeconds = 45, targetUserId }: QRGenerateRequest = await req.json();

    // Get current user's data for authorization
    const { data: currentUserData, error: currentUserError } = await supabaseUserClient
      .from('users')
      .select('organization_id, name, role')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUserData) {
      console.error('Current user data error:', currentUserError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If targetUserId is provided, validate manager/team_leader can assist
    let targetUser = currentUserData;
    if (targetUserId && targetUserId !== user.id) {
      // Check if current user has permission to generate for others
      const canAssist = ['manager', 'team_leader', 'admin', 'superadmin'].includes(currentUserData.role);
      
      if (!canAssist) {
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized',
            details: 'Only managers and team leaders can generate QR codes for employees'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get target user's data
      const { data: targetUserData, error: targetUserError } = await supabaseUserClient
        .from('users')
        .select('id, organization_id, name')
        .eq('id', targetUserId)
        .single();

      if (targetUserError || !targetUserData) {
        return new Response(
          JSON.stringify({ error: 'Target employee not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify same organization
      if (targetUserData.organization_id !== currentUserData.organization_id) {
        return new Response(
          JSON.stringify({ error: 'Cannot generate QR for employees in different organizations' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetUser = targetUserData;
      console.log(`Manager ${currentUserData.name} generating QR for employee ${targetUserData.name}`);
    }

    const userData = targetUser;

    // Validate organization_id exists
    if (!userData.organization_id) {
      console.error('Missing organization_id for user:', userData.id);
      return new Response(
        JSON.stringify({ 
          error: 'User configuration error',
          details: 'User missing organization assignment. Please contact support.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch attendance settings for organization
    const { data: attendanceSettings } = await supabaseUserClient
      .from('organization_attendance_settings')
      .select('require_schedule_for_clock_in, allow_early_clock_in_minutes, allow_late_clock_in_minutes')
      .eq('organization_id', userData.organization_id)
      .maybeSingle();

    console.log('Attendance settings:', attendanceSettings);

    // Check if user belongs to a team and get team settings
    let teamRequiresSchedule: boolean | null = null;
    const { data: userTeams } = await supabaseUserClient
      .from('team_memberships')
      .select('teams(require_schedule_for_clock_in)')
      .eq('user_id', userData.id)
      .limit(1)
      .maybeSingle();

    if (userTeams?.teams) {
      teamRequiresSchedule = (userTeams.teams as any).require_schedule_for_clock_in;
    }

    // Determine if schedule is required (team setting overrides org setting)
    const requireScheduleForClockIn = teamRequiresSchedule !== null 
      ? teamRequiresSchedule 
      : (attendanceSettings?.require_schedule_for_clock_in ?? false);

    console.log('Require schedule for clock-in:', { teamRequiresSchedule, orgSetting: attendanceSettings?.require_schedule_for_clock_in, effective: requireScheduleForClockIn });

    // Check if user has an active schedule for today (only if required)
    if (tokenType === 'clock_in' && requireScheduleForClockIn) {
      const today = new Date().toISOString().split('T')[0];
      const { data: schedules } = await supabaseUserClient
        .from('employee_schedules')
        .select('id, status')
        .eq('employee_id', userData.id)
        .eq('scheduled_date', today)
        .eq('status', 'scheduled');

      if (!schedules || schedules.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No active schedule found for today',
            details: 'Your organization requires an active schedule to clock in. Please contact your manager.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for existing active time entry (for clock_in)
    if (tokenType === 'clock_in') {
      const { data: activeEntry } = await supabaseUserClient
        .from('time_entries')
        .select('id')
        .eq('user_id', userData.id)
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
      const { data: activeEntry } = await supabaseUserClient
        .from('time_entries')
        .select('id')
        .eq('user_id', userData.id)
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
      userId: userData.id,
      userName: userData.name,
      timestamp: Date.now(),
      tokenType,
      organizationId: userData.organization_id,
      random: crypto.randomUUID()
    };

    const token = btoa(JSON.stringify(tokenPayload));
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000);

    // Store token in database using secure database function (bypasses RLS)
    const { data: tokenData, error: tokenError } = await supabaseUserClient
      .rpc('create_qr_attendance_token', {
        p_organization_id: userData.organization_id,
        p_user_id: userData.id,
        p_token: token,
        p_token_type: tokenType,
        p_expires_at: expiresAt.toISOString()
      });

    if (tokenError || !tokenData || tokenData.length === 0) {
      console.error('Token creation error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const createdToken = tokenData[0];

    console.log(`QR token generated for user ${userData.id}, type: ${tokenType}, expires in ${expirationSeconds}s`);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
        tokenType,
        userName: userData.name,
        userId: userData.id,
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