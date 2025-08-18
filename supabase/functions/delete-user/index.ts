
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface DeleteUserRequest {
  targetUserId: string;
  deletionReason?: string;
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

    // Get client info for audit logging
    const userAgent = req.headers.get('User-Agent') || 'Unknown';
    const forwardedFor = req.headers.get('X-Forwarded-For');
    const realIP = req.headers.get('X-Real-IP');
    const ipAddress = forwardedFor?.split(',')[0] || realIP || 'Unknown';

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
    const { targetUserId, deletionReason }: DeleteUserRequest = await req.json();

    if (!targetUserId) {
      throw new Error('Missing targetUserId');
    }

    console.log('Attempting to delete user:', targetUserId);

    // Get the requesting user's role from the database
    const { data: requestingUserData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, email, name, organization_id')
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
    const { data: targetUserData, error: targetUserError } = await supabaseAdmin
      .from('users')
      .select('name, email, role, organization_id')
      .eq('id', targetUserId)
      .single();

    if (targetUserError || !targetUserData) {
      console.error('Target user not found:', targetUserError);
      throw new Error('Target user not found');
    }

    console.log('Target user to delete:', targetUserData);

    // Enforce organization scope - requester and target must be in same organization
    if (requestingUserData.organization_id !== targetUserData.organization_id) {
      console.error('Cross-organization deletion attempt blocked');
      throw new Error('Permission denied - users must be in the same organization');
    }

    // Get deletion impact analysis
    const { data: impactData, error: impactError } = await supabaseAdmin
      .rpc('get_user_deletion_impact', { target_user_id: targetUserId });

    if (impactError) {
      console.error('Error getting deletion impact:', impactError);
      throw new Error('Could not analyze deletion impact');
    }

    console.log('Deletion impact analysis:', impactData);

    // Check if user is sole admin - prevent deletion if true
    if (impactData.is_sole_admin) {
      console.error('Cannot delete sole admin - requires admin transfer first');
      throw new Error('Cannot delete the only admin. Please assign another admin first.');
    }

    // Start comprehensive cleanup process
    console.log('Starting comprehensive user deletion process...');

    // 1. Remove user from all chat room participations
    const { error: chatParticipantError } = await supabaseAdmin
      .from('chat_participants')
      .delete()
      .eq('user_id', targetUserId);

    if (chatParticipantError) {
      console.error('Error removing user from chat rooms:', chatParticipantError);
    } else {
      console.log('Removed user from all chat rooms');
    }

    // 2. Delete user's chat messages
    const { error: chatMessagesError } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .eq('user_id', targetUserId);

    if (chatMessagesError) {
      console.error('Error deleting chat messages:', chatMessagesError);
    } else {
      console.log('Deleted user chat messages');
    }

    // 3. Delete user's journal entries
    const { error: journalError } = await supabaseAdmin
      .from('journal_entries')
      .delete()
      .eq('user_id', targetUserId);

    if (journalError) {
      console.error('Error deleting journal entries:', journalError);
    } else {
      console.log('Deleted user journal entries');
    }

    // 4. Delete user's time entries
    const { error: timeEntriesError } = await supabaseAdmin
      .from('time_entries')
      .delete()
      .eq('user_id', targetUserId);

    if (timeEntriesError) {
      console.error('Error deleting time entries:', timeEntriesError);
    } else {
      console.log('Deleted user time entries');
    }

    // 5. Delete user's notifications
    const { error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', targetUserId);

    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError);
    } else {
      console.log('Deleted user notifications');
    }

    // 6. Remove user from shared folders
    const { error: sharedFoldersError } = await supabaseAdmin
      .from('shared_folders')
      .delete()
      .or(`owner_id.eq.${targetUserId},shared_with_user_id.eq.${targetUserId}`);

    if (sharedFoldersError) {
      console.error('Error removing from shared folders:', sharedFoldersError);
    } else {
      console.log('Removed user from shared folders');
    }

    // 7. Remove user from all project teams
    const { error: teamRemovalError } = await supabaseAdmin
      .from('project_team_members')
      .delete()
      .eq('user_id', targetUserId);

    if (teamRemovalError) {
      console.error('Error removing user from teams:', teamRemovalError);
    } else {
      console.log('Removed user from all project teams');
    }

    // 8. Remove user from team_members table
    const { error: teamMemberRemovalError } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('id', targetUserId);

    if (teamMemberRemovalError) {
      console.error('Error removing from team_members:', teamMemberRemovalError);
    }

    // 9. Unassign user from all tasks
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
    } else {
      console.log('Updated tasks assigned to user');
    }

    // 10. Delete all documents belonging to the user
    const { error: documentsDeleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('user_id', targetUserId);

    if (documentsDeleteError) {
      console.error('Error deleting user documents:', documentsDeleteError);
    } else {
      console.log('Deleted all user documents');
    }

    // 11. Delete comments by the user
    const { error: commentsDeleteError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('user_id', targetUserId);

    if (commentsDeleteError) {
      console.error('Error deleting user comments:', commentsDeleteError);
    } else {
      console.log('Deleted user comments');
    }

    // 12. Create audit log entry
    const { error: auditError } = await supabaseAdmin
      .from('user_deletion_audit')
      .insert({
        deleted_user_id: targetUserId,
        deleted_user_email: targetUserData.email,
        deleted_user_name: targetUserData.name,
        deleted_user_role: targetUserData.role,
        deleted_by_user_id: user.id,
        deleted_by_user_email: requestingUserData.email,
        affected_resources: impactData,
        deletion_reason: deletionReason || 'No reason provided',
        ip_address: ipAddress,
        user_agent: userAgent
      });

    if (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the deletion for audit log errors
    } else {
      console.log('Created audit log entry');
    }

    // 13. Delete from custom users table
    const { error: dbDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', targetUserId);

    if (dbDeleteError) {
      console.error('Database deletion error:', dbDeleteError);
      throw new Error(`Failed to delete user from database: ${dbDeleteError.message}`);
    }

    console.log('Deleted user from custom users table');

    // 14. Finally, delete from auth.users using admin client
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      targetUserId
    );

    if (authDeleteError) {
      console.error('Auth deletion error:', authDeleteError);
      throw new Error(`Failed to delete user from auth: ${authDeleteError.message}`);
    }

    console.log('Deleted user from auth system');

    // Log the successful deletion for audit purposes
    console.log(`User deletion successful: ${targetUserData?.name} (${targetUserData?.email}) deleted by ${requestingUserData.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        deletedUser: {
          name: targetUserData?.name,
          email: targetUserData?.email,
          role: targetUserData?.role
        },
        impactSummary: impactData
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
