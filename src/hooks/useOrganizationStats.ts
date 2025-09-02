
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

interface OrganizationStats {
  total_users: number;
  superadmins: number;
  admins: number;
  managers: number;
  users: number;
  active_projects: number;
  total_tasks: number;
  completed_tasks: number;
  total_teams: number;
}

export const useOrganizationStats = () => {
  const { user } = useAuth();

  const fetchOrganizationStats = async (): Promise<OrganizationStats> => {
    if (!user?.organizationId) {
      throw new Error('User must belong to an organization');
    }

    // Fetch both organization stats and team stats
    const [orgStatsResponse, teamStatsResponse] = await Promise.all([
      supabase.rpc('get_organization_stats', { org_id: user.organizationId }),
      supabase.rpc('get_team_stats', { org_id: user.organizationId })
    ]);

    if (orgStatsResponse.error) {
      console.error('Error fetching organization stats:', orgStatsResponse.error);
      throw new Error(orgStatsResponse.error.message);
    }

    if (teamStatsResponse.error) {
      console.error('Error fetching team stats:', teamStatsResponse.error);
      throw new Error(teamStatsResponse.error.message);
    }

    // Parse the JSON responses
    const orgData = typeof orgStatsResponse.data === 'string' ? JSON.parse(orgStatsResponse.data) : orgStatsResponse.data;
    const teamData = typeof teamStatsResponse.data === 'string' ? JSON.parse(teamStatsResponse.data) : teamStatsResponse.data;
    
    return {
      total_users: orgData.total_users || 0,
      superadmins: orgData.superadmins || 0,
      admins: orgData.admins || 0,
      managers: orgData.managers || 0,
      users: orgData.users || 0,
      active_projects: orgData.active_projects || 0,
      total_tasks: orgData.total_tasks || 0,
      completed_tasks: orgData.completed_tasks || 0,
      total_teams: teamData.total_teams || 0,
    } as OrganizationStats;
  };

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['organization-stats', user?.organizationId],
    queryFn: fetchOrganizationStats,
    enabled: !!user?.organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    meta: {
      onError: (err: Error) => {
        console.error('Error in useOrganizationStats:', err);
        toast.error('Failed to load organization statistics');
      }
    }
  });

  return {
    stats,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch
  };
};
