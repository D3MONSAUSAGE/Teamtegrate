
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useTeamMemberOperations = () => {
  const queryClient = useQueryClient();

  const invalidateTeamQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    queryClient.invalidateQueries({ queryKey: ['team-stats'] });
  };

  // Add team member
  const addTeamMember = async (teamId: string, userId: string, role: 'manager' | 'member' = 'member') => {
    try {
      const { error } = await supabase
        .from('team_memberships')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
        });

      if (error) throw error;

      invalidateTeamQueries();
      toast.success('Team member added successfully');
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
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
  const updateTeamMemberRole = async (teamId: string, userId: string, newRole: 'manager' | 'member') => {
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
  const transferTeamMember = async (fromTeamId: string, toTeamId: string, userId: string, newRole: 'manager' | 'member' = 'member') => {
    try {
      // Remove from current team
      const { error: removeError } = await supabase
        .from('team_memberships')
        .delete()
        .eq('team_id', fromTeamId)
        .eq('user_id', userId);

      if (removeError) throw removeError;

      // Add to new team
      const { error: addError } = await supabase
        .from('team_memberships')
        .insert({
          team_id: toTeamId,
          user_id: userId,
          role: newRole,
        });

      if (addError) throw addError;

      // Update task team assignments
      await supabase
        .from('tasks')
        .update({ team_id: toTeamId })
        .or(`user_id.eq.${userId},assigned_to_id.eq.${userId}`)
        .eq('team_id', fromTeamId);

      invalidateTeamQueries();
      toast.success('Team member transferred successfully');
    } catch (error) {
      console.error('Error transferring team member:', error);
      toast.error('Failed to transfer team member');
      throw error;
    }
  };

  // Bulk transfer multiple team members
  const bulkTransferMembers = async (fromTeamId: string, toTeamId: string, userIds: string[], newRole: 'manager' | 'member' = 'member') => {
    try {
      // Remove from current team
      const { error: removeError } = await supabase
        .from('team_memberships')
        .delete()
        .eq('team_id', fromTeamId)
        .in('user_id', userIds);

      if (removeError) throw removeError;

      // Add to new team
      const memberships = userIds.map(userId => ({
        team_id: toTeamId,
        user_id: userId,
        role: newRole,
      }));

      const { error: addError } = await supabase
        .from('team_memberships')
        .insert(memberships);

      if (addError) throw addError;

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
    removeTeamMember,
    updateTeamMemberRole,
    transferTeamMember,
    bulkTransferMembers,
  };
};
