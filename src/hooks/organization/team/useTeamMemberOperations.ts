
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

  return {
    addTeamMember,
    removeTeamMember,
  };
};
