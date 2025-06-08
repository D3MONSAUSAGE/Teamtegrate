
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateRoleRequest {
  targetUserId: string;
  newRole: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the requesting user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('Request from user:', user.id, 'with role:', user.user_metadata?.role);

    // Parse request body
    const { targetUserId, newRole }: UpdateRoleRequest = await req.json();

    if (!targetUserId || !newRole) {
      throw new Error('Missing targetUserId or newRole');
    }

    console.log('Attempting to update user:', targetUserId, 'to role:', newRole);

    // Get the requesting user's role from the database
    const { data: requestingUserData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !requestingUserData) {
      console.error('Error fetching requesting user:', userError);
      throw new Error('Could not verify requesting user');
    }

    const requestingUserRole = requestingUserData.role;
    console.log('Requesting user role from DB:', requestingUserRole);

    // Get the target user's current role
    const { data: targetUserData, error: targetError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUserData) {
      console.error('Error fetching target user:', targetError);
      throw new Error('Target user not found');
    }

    const currentTargetRole = targetUserData.role;
    console.log('Target user current role:', currentTargetRole);

    // Permission validation
    const canUpdate = (() => {
      // Superadmin can update everyone except themselves
      if (requestingUserRole === 'superadmin' && targetUserId !== user.id) {
        return true;
      }
      
      // Admin can update managers and users (but not superadmins or other admins)
      if (requestingUserRole === 'admin' && 
          ['manager', 'user'].includes(currentTargetRole) && 
          targetUserId !== user.id) {
        return true;
      }
      
      return false;
    })();

    if (!canUpdate) {
      console.error('Permission denied for role update');
      throw new Error('Permission denied');
    }

    // Validate the new role
    const validRoles = ['user', 'manager', 'admin', 'superadmin'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }

    console.log('Permission check passed, proceeding with role update');

    // Update in auth metadata using admin client
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      {
        user_metadata: { role: newRole }
      }
    );

    if (authUpdateError) {
      console.error('Auth update error:', authUpdateError);
      throw new Error(`Failed to update auth metadata: ${authUpdateError.message}`);
    }

    console.log('Auth metadata updated successfully');

    // Update in users table
    const { error: dbUpdateError } = await supabaseAdmin
      .from('users')
      .update({ role: newRole })
      .eq('id', targetUserId);

    if (dbUpdateError) {
      console.error('Database update error:', dbUpdateError);
      throw new Error(`Failed to update user role in database: ${dbUpdateError.message}`);
    }

    console.log('Database updated successfully');

    // Log the role change for audit purposes
    console.log(`Role change successful: User ${targetUserId} changed from ${currentTargetRole} to ${newRole} by ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Role updated to ${newRole} successfully`,
        previousRole: currentTargetRole,
        newRole: newRole
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in update-user-role function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
