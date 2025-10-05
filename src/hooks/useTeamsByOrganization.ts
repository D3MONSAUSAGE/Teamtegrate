
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  manager_id?: string;
  created_at: string;
}

export const useTeamsByOrganization = (organizationId?: string) => {
  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['teams-by-organization', organizationId],
    queryFn: async (): Promise<Team[]> => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, description, organization_id, manager_id, created_at')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!organizationId,
    staleTime: 30000,
  });

  return {
    teams,
    isLoading,
    error: error ? (error as Error).message : null,
  };
};
