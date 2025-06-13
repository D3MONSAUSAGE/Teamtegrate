
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
}

export const useOrganizationStats = () => {
  const { user } = useAuth();

  const fetchOrganizationStats = async (): Promise<OrganizationStats> => {
    if (!user?.organizationId) {
      throw new Error('User must belong to an organization');
    }

    const { data, error } = await supabase
      .rpc('get_organization_stats', { org_id: user.organizationId });

    if (error) {
      console.error('Error fetching organization stats:', error);
      throw new Error(error.message);
    }

    // Parse the JSON response and ensure it matches our interface
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    
    return {
      total_users: parsedData.total_users || 0,
      superadmins: parsedData.superadmins || 0,
      admins: parsedData.admins || 0,
      managers: parsedData.managers || 0,
      users: parsedData.users || 0,
      active_projects: parsedData.active_projects || 0,
      total_tasks: parsedData.total_tasks || 0,
      completed_tasks: parsedData.completed_tasks || 0,
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
