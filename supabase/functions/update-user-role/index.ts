
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
    console.log('Update user role function called');
    
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing environment variables');
      throw new Error('Server configuration error');
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the requesting user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized - invalid token');
    }

    console.log('Request from user:', user.id);

    // Parse request body
    let requestBody: UpdateRoleRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      throw new Error('Invalid request body');
    }

    const { targetUserId, newRole } = requestBody;

    if (!targetUserId || !newRole) {
      console.error('Missing required fields:', { targetUserId: !!targetUserId, newRole: !!newRole });
      throw new Error('Missing targetUserId or newRole');
    }

    console.log('Attempting to update user:', targetUserId, 'to role:', newRole);

    // Get the requesting user's role and organization from the database using service role
    const { data: requestingUserData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !requestingUserData) {
      console.error('Error fetching requesting user:', userError);
      throw new Error('Could not verify requesting user permissions');
    }

    const requestingUserRole = requestingUserData.role;
    const requestingUserOrgId = requestingUserData.organization_id;
    console.log('Requesting user role from DB:', requestingUserRole);
    console.log('Requesting user organization:', requestingUserOrgId);

    // Get the target user's current role and organization using service role
    const { data: targetUserData, error: targetError } = await supabaseAdmin
      .from('users')
      .select('role, name, email, organization_id')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUserData) {
      console.error('Error fetching target user:', targetError);
      throw new Error('Target user not found');
    }

    const currentTargetRole = targetUserData.role;
    const targetUserOrgId = targetUserData.organization_id;
    console.log('Target user current role:', currentTargetRole);
    console.log('Target user organization:', targetUserOrgId);

    // Organization isolation check - users can only manage users within their organization
    if (requestingUserOrgId !== targetUserOrgId) {
      console.error('Organization mismatch - requesting user org:', requestingUserOrgId, 'target user org:', targetUserOrgId);
      throw new Error('Permission denied - users can only manage users within their organization');
    }

    // Permission validation within the same organization
    const canUpdate = (() => {
      // Superadmin can update everyone except themselves within their organization
      if (requestingUserRole === 'superadmin' && targetUserId !== user.id) {
        return true;
      }
      
      // Admin can update managers and users (but not superadmins or other admins) within their organization
      if (requestingUserRole === 'admin' && 
          ['manager', 'user'].includes(currentTargetRole) && 
          targetUserId !== user.id) {
        return true;
      }
      
      return false;
    })();

    if (!canUpdate) {
      console.error('Permission denied for role update');
      throw new Error('Permission denied - insufficient privileges');
    }

    // Validate the new role
    const validRoles = ['user', 'manager', 'admin', 'superadmin'];
    if (!validRoles.includes(newRole)) {
      console.error('Invalid role provided:', newRole);
      throw new Error('Invalid role specified');
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
      throw new Error(`Failed to update authentication: ${authUpdateError.message}`);
    }

    console.log('Auth metadata updated successfully');

    // Update in users table using service role
    const { error: dbUpdateError } = await supabaseAdmin
      .from('users')
      .update({ role: newRole })
      .eq('id', targetUserId);

    if (dbUpdateError) {
      console.error('Database update error:', dbUpdateError);
      throw new Error(`Failed to update user database: ${dbUpdateError.message}`);
    }

    console.log('Database updated successfully');

    // Log the successful role change
    console.log(`Role change successful: User ${targetUserData.name} (${targetUserData.email}) changed from ${currentTargetRole} to ${newRole} by ${user.id} within organization ${requestingUserOrgId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Role updated to ${newRole} successfully`,
        previousRole: currentTargetRole,
        newRole: newRole,
        targetUser: {
          name: targetUserData.name,
          email: targetUserData.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in update-user-role function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
