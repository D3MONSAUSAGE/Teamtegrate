import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  targetUserId: string;
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

    console.log('Delete request from user:', user.id);

    // Parse request body
    const { targetUserId }: DeleteUserRequest = await req.json();

    if (!targetUserId) {
      throw new Error('Missing targetUserId');
    }

    console.log('Attempting to delete user:', targetUserId);

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
    console.log('Requesting user role:', requestingUserRole);

    // Only superadmin can delete users
    if (requestingUserRole !== 'superadmin') {
      console.error('Permission denied - user is not superadmin');
      throw new Error('Permission denied - only superadmin can delete users');
    }

    // Prevent self-deletion
    if (targetUserId === user.id) {
      console.error('Cannot delete own account');
      throw new Error('Cannot delete your own account');
    }

    // Get target user info before deletion for logging
    const { data: targetUserData } = await supabaseAdmin
      .from('users')
      .select('name, email, role')
      .eq('id', targetUserId)
      .single();

    console.log('Target user to delete:', targetUserData);

    // Start comprehensive cleanup process
    console.log('Starting user deletion process...');

    // 1. Remove user from all project teams
    const { error: teamRemovalError } = await supabaseAdmin
      .from('project_team_members')
      .delete()
      .eq('user_id', targetUserId);

    if (teamRemovalError) {
      console.error('Error removing user from teams:', teamRemovalError);
      // Continue with deletion even if this fails
    } else {
      console.log('Removed user from all project teams');
    }

    // 2. Remove user from team_members table
    const { error: teamMemberRemovalError } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('id', targetUserId);

    if (teamMemberRemovalError) {
      console.error('Error removing from team_members:', teamMemberRemovalError);
      // Continue with deletion even if this fails
    }

    // 3. Handle tasks assigned to the user - reassign to null or delete based on your business logic
    const { error: taskUpdateError } = await supabaseAdmin
      .from('tasks')
      .update({ 
        assigned_to_id: null,
        assigned_to_ids: [],
        assigned_to_names: []
      })
      .eq('assigned_to_id', targetUserId);

    if (taskUpdateError) {
      console.error('Error updating tasks:', taskUpdateError);
      // Continue with deletion even if this fails
    } else {
      console.log('Updated tasks assigned to user');
    }

    // 4. Handle project_tasks assigned to the user
    const { error: projectTaskUpdateError } = await supabaseAdmin
      .from('project_tasks')
      .update({ 
        assigned_to_id: null,
        assigned_to_ids: [],
        assigned_to_names: []
      })
      .or(`assigned_to_id.eq.${targetUserId},assigned_to_ids.cs.{${targetUserId}}`);

    if (projectTaskUpdateError) {
      console.error('Error updating project tasks:', projectTaskUpdateError);
      // Continue with deletion even if this fails
    } else {
      console.log('Updated project tasks assigned to user');
    }

    // 5. Delete all documents belonging to the user
    const { error: documentsDeleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('user_id', targetUserId);

    if (documentsDeleteError) {
      console.error('Error deleting user documents:', documentsDeleteError);
      // Continue with deletion even if this fails
    } else {
      console.log('Deleted all user documents');
    }

    // 6. Delete from custom users table
    const { error: dbDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', targetUserId);

    if (dbDeleteError) {
      console.error('Database deletion error:', dbDeleteError);
      throw new Error(`Failed to delete user from database: ${dbDeleteError.message}`);
    }

    console.log('Deleted user from custom users table');

    // 7. Finally, delete from auth.users using admin client
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      targetUserId
    );

    if (authDeleteError) {
      console.error('Auth deletion error:', authDeleteError);
      throw new Error(`Failed to delete user from auth: ${authDeleteError.message}`);
    }

    console.log('Deleted user from auth system');

    // Log the successful deletion for audit purposes
    console.log(`User deletion successful: ${targetUserData?.name} (${targetUserData?.email}) deleted by ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        deletedUser: {
          name: targetUserData?.name,
          email: targetUserData?.email,
          role: targetUserData?.role
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    
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
