
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Team, TeamMembership, TeamStats, CreateTeamData } from '@/types/teams';

export const useTeamManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading, error: teamsError } = useQuery({
    queryKey: ['teams', user?.organizationId],
    queryFn: async (): Promise<Team[]> => {
      if (!user?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('team_details')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId,
  });

  // Fetch team stats
  const { data: teamStats } = useQuery({
    queryKey: ['team-stats', user?.organizationId],
    queryFn: async (): Promise<TeamStats> => {
      if (!user?.organizationId) {
        return { total_teams: 0, teams_with_managers: 0, total_team_members: 0, average_team_size: 0 };
      }
      
      const { data, error } = await supabase.rpc('get_team_stats', { 
        org_id: user.organizationId 
      });

      if (error) throw error;
      return data || { total_teams: 0, teams_with_managers: 0, total_team_members: 0, average_team_size: 0 };
    },
    enabled: !!user?.organizationId,
  });

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

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
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

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
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

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      toast.success('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
      throw error;
    }
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

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
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

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      toast.success('Team member removed successfully');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
      throw error;
    }
  };

  const refetchTeams = () => {
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    queryClient.invalidateQueries({ queryKey: ['team-stats'] });
  };

  return {
    teams,
    teamStats,
    isLoading: teamsLoading,
    error: teamsError,
    isCreating,
    isUpdating,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    refetchTeams,
  };
};
