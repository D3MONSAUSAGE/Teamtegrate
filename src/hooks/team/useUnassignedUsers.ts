import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UnassignedUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role?: string;
}

export const useUnassignedUsers = () => {
  const { user } = useAuth();

  const { data: orgUsers = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['org-users', user?.organizationId],
    queryFn: async (): Promise<UnassignedUser[]> => {
      if (!user?.organizationId) return [];
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, role, organization_id')
        .eq('organization_id', user.organizationId);
      if (error) throw error;
      return (data || []) as unknown as UnassignedUser[];
    },
    enabled: !!user?.organizationId,
  });

  const { data: memberships = [], isLoading: memLoading, error: memError } = useQuery({
    queryKey: ['team-memberships-all', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      const { data, error } = await supabase
        .from('team_memberships')
        .select(`
          user_id,
          team_id,
          team:teams!team_memberships_team_id_fkey (organization_id)
        `)
        .eq('teams.organization_id', user.organizationId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId,
  });

  const assignedIds = new Set<string>(memberships.map((m: any) => m.user_id));
  const unassignedUsers: UnassignedUser[] = orgUsers.filter((u: any) => !assignedIds.has(u.id));

  return {
    unassignedUsers,
    isLoading: usersLoading || memLoading,
    error: usersError || memError,
  };
};