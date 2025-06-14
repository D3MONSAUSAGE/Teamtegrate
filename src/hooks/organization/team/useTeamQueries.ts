
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Team, TeamStats } from '@/types/teams';

export const useTeamQueries = () => {
  const { user } = useAuth();

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
      
      // Handle the JSON response properly
      if (data && typeof data === 'object') {
        return {
          total_teams: (data as any).total_teams || 0,
          teams_with_managers: (data as any).teams_with_managers || 0,
          total_team_members: (data as any).total_team_members || 0,
          average_team_size: (data as any).average_team_size || 0,
        };
      }
      
      return { total_teams: 0, teams_with_managers: 0, total_team_members: 0, average_team_size: 0 };
    },
    enabled: !!user?.organizationId,
  });

  return {
    teams,
    teamStats,
    isLoading: teamsLoading,
    error: teamsError,
  };
};
