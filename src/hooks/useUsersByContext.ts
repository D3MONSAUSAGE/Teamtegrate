
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const useUsersByContext = (organizationId?: string, teamId?: string) => {
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['users-by-context', organizationId, teamId],
    queryFn: async (): Promise<User[]> => {
      // Determine which organization to query
      let targetOrgId = organizationId;
      if (!targetOrgId) {
        targetOrgId = currentUser?.organizationId;
      }

      if (!targetOrgId) {
        console.log('No organization ID available');
        return [];
      }

      console.log('Fetching users for context:', { organizationId: targetOrgId, teamId });

      let query = supabase
        .from('users')
        .select('id, name, email, role, organization_id, created_at, avatar_url')
        .eq('organization_id', targetOrgId);

      // If team is specified, filter by team membership
      if (teamId) {
        const { data: teamMembers } = await supabase
          .from('team_memberships')
          .select('user_id')
          .eq('team_id', teamId);

        if (teamMembers && teamMembers.length > 0) {
          const userIds = teamMembers.map(tm => tm.user_id);
          query = query.in('id', userIds);
        } else {
          // No team members found, return empty array
          return [];
        }
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching users by context:', error);
        throw new Error(error.message);
      }

      console.log(`Loaded ${data?.length || 0} users for context`);

      // Transform to User type
      const transformedUsers: User[] = (data || []).map(user => ({
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        role: user.role as User['role'],
        organizationId: user.organization_id,
        createdAt: new Date(user.created_at),
        timezone: 'UTC',
        avatar_url: user.avatar_url
      }));

      return transformedUsers;
    },
    enabled: !!currentUser,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  return {
    users,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch
  };
};
