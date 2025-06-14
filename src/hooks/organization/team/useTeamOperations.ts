
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { CreateTeamData } from '@/types/teams';

export const useTeamOperations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const invalidateTeamQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    queryClient.invalidateQueries({ queryKey: ['team-stats'] });
  };

  // Create team
  const createTeam = async (teamData: CreateTeamData) => {
    if (!user?.organizationId) {
      toast.error('Organization not found');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          ...teamData,
          organization_id: user.organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      // If a manager is assigned, add them to team memberships
      if (teamData.manager_id) {
        await supabase
          .from('team_memberships')
          .insert({
            team_id: data.id,
            user_id: teamData.manager_id,
            role: 'manager',
          });
      }

      invalidateTeamQueries();
      toast.success('Team created successfully');
      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Update team
  const updateTeam = async (teamId: string, updates: Partial<CreateTeamData>) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);

      if (error) throw error;

      invalidateTeamQueries();
      toast.success('Team updated successfully');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete team
  const deleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', teamId);

      if (error) throw error;

      invalidateTeamQueries();
      toast.success('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
      throw error;
    }
  };

  const refetchTeams = () => {
    invalidateTeamQueries();
  };

  return {
    isCreating,
    isUpdating,
    createTeam,
    updateTeam,
    deleteTeam,
    refetchTeams,
  };
};
