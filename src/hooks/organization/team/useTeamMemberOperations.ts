
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useTeamMemberOperations = () => {
  const queryClient = useQueryClient();

  const invalidateTeamQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    queryClient.invalidateQueries({ queryKey: ['team-stats'] });
    queryClient.invalidateQueries({ queryKey: ['team-members'] });
    queryClient.invalidateQueries({ queryKey: ['organization-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['organization-teams'] });
    queryClient.invalidateQueries({ queryKey: ['teams-by-organization'] });
  };

  // Add team member with optional team leader role
  const addTeamMember = async (teamId: string, userId: string, role: 'manager' | 'member' | 'admin' = 'member', systemRoleOverride?: string) => {
    try {
      const membershipData: any = {
        team_id: teamId,
        user_id: userId,
        role,
      };

      // Add system role override for team leaders
      if (systemRoleOverride) {
        membershipData.system_role_override = systemRoleOverride;
      }

      const { error } = await supabase
        .from('team_memberships')
        .insert(membershipData);

      if (error) throw error;

      invalidateTeamQueries();
      toast.success('Team member added successfully');
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
      throw error;
    }
  };

  // Bulk add team members with different roles
  const bulkAddTeamMembers = async (teamId: string, members: Array<{userId: string, role: 'manager' | 'member' | 'admin', systemRoleOverride?: string}>) => {
    try {
      const memberships = members.map(member => ({
        team_id: teamId,
        user_id: member.userId,
        role: member.role,
        ...(member.systemRoleOverride && { system_role_override: member.systemRoleOverride })
      }));

      const { error } = await supabase
        .from('team_memberships')
        .insert(memberships);

      if (error) throw error;

      invalidateTeamQueries();
      toast.success(`${members.length} team members added successfully`);
    } catch (error) {
      console.error('Error bulk adding team members:', error);
      toast.error('Failed to add team members');
      throw error;
    }
  };

  // Remove team member
  const removeTeamMember = async (teamId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      invalidateTeamQueries();
      toast.success('Team member removed successfully');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
      throw error;
    }
  };

  // Update team member role
  const updateTeamMemberRole = async (teamId: string, userId: string, newRole: 'manager' | 'member' | 'admin') => {
    try {
      const { error } = await supabase
        .from('team_memberships')
        .update({ role: newRole })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      invalidateTeamQueries();
      toast.success('Team member role updated successfully');
    } catch (error) {
      console.error('Error updating team member role:', error);
      toast.error('Failed to update team member role');
      throw error;
    }
  };

  // Transfer team member to another team
  const transferTeamMember = async (
    fromTeamId: string,
    toTeamId: string,
    userId: string,
    newRole: 'manager' | 'member' | 'admin' = 'member',
    jobRoles?: { jobRoleId: string, isPrimary: boolean }[]
  ) => {
    try {
      // Upsert into destination team first to avoid duplicate key conflicts
      const { error: upsertError } = await supabase
        .from('team_memberships')
        .upsert(
          { team_id: toTeamId, user_id: userId, role: newRole },
          { onConflict: 'team_id,user_id', ignoreDuplicates: false }
        );

      if (upsertError) throw upsertError;

      // Remove from current team (if exists)
      const { error: removeError } = await supabase
        .from('team_memberships')
        .delete()
        .eq('team_id', fromTeamId)
        .eq('user_id', userId);

      if (removeError) {
        console.warn('Error removing member from source team (continuing):', removeError);
      }

      // Update task team assignments
      await supabase
        .from('tasks')
        .update({ team_id: toTeamId })
        .or(`user_id.eq.${userId},assigned_to_id.eq.${userId}`)
        .eq('team_id', fromTeamId);

      // Update job roles if provided
      if (jobRoles && jobRoles.length > 0) {
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', userId)
          .single();

        if (userData?.organization_id) {
          // Delete existing job roles
          const { error: deleteError } = await supabase
            .from('user_job_roles')
            .delete()
            .eq('user_id', userId);

          if (deleteError) {
            console.error('Error deleting old job roles:', deleteError);
          }

          // Insert new job roles
          const jobRoleInserts = jobRoles.map(jr => ({
            user_id: userId,
            job_role_id: jr.jobRoleId,
            is_primary: jr.isPrimary,
            organization_id: userData.organization_id
          }));

          const { error: insertError } = await supabase
            .from('user_job_roles')
            .insert(jobRoleInserts);

          if (insertError) {
            console.error('Error inserting new job roles:', insertError);
            throw insertError;
          }
        }
      }

      invalidateTeamQueries();
      toast.success('Team member transferred successfully');
    } catch (error) {
      console.error('Error transferring team member:', error);
      toast.error('Failed to transfer team member');
      throw error;
    }
  };

  // Bulk transfer multiple team members
  const bulkTransferMembers = async (fromTeamId: string, toTeamId: string, userIds: string[], newRole: 'manager' | 'member' | 'admin' = 'member') => {
    try {
      // Upsert memberships in destination team first
      const memberships = userIds.map(userId => ({
        team_id: toTeamId,
        user_id: userId,
        role: newRole,
      }));

      const { error: upsertError } = await supabase
        .from('team_memberships')
        .upsert(memberships, { onConflict: 'team_id,user_id', ignoreDuplicates: false });

      if (upsertError) throw upsertError;

      // Remove from current team (if rows exist)
      const { error: removeError } = await supabase
        .from('team_memberships')
        .delete()
        .eq('team_id', fromTeamId)
        .in('user_id', userIds);

      if (removeError) {
        console.warn('Error removing some members from source team (continuing):', removeError);
      }

      // Update task team assignments
      await supabase
        .from('tasks')
        .update({ team_id: toTeamId })
        .in('user_id', userIds)
        .eq('team_id', fromTeamId);

      await supabase
        .from('tasks')
        .update({ team_id: toTeamId })
        .in('assigned_to_id', userIds)
        .eq('team_id', fromTeamId);

      invalidateTeamQueries();
      toast.success(`${userIds.length} team members transferred successfully`);
    } catch (error) {
      console.error('Error bulk transferring team members:', error);
      toast.error('Failed to transfer team members');
      throw error;
    }
  };

  return {
    addTeamMember,
    bulkAddTeamMembers,
    removeTeamMember,
    updateTeamMemberRole,
    transferTeamMember,
    bulkTransferMembers,
  };
};
