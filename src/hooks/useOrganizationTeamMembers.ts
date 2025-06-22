
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export const useOrganizationTeamMembers = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const fetchTeamMembers = async (): Promise<User[]> => {
    if (!currentUser?.organizationId) {
      console.log('useOrganizationTeamMembers: No organization ID available');
      return [];
    }

    console.log('useOrganizationTeamMembers: Fetching team members for organization:', currentUser.organizationId);

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, organization_id, created_at, avatar_url')
      .eq('organization_id', currentUser.organizationId)
      .order('name');

    if (error) {
      console.error('useOrganizationTeamMembers: Error fetching team members:', error);
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }

    console.log(`useOrganizationTeamMembers: Successfully loaded ${data?.length || 0} team members`);

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
  };

  const { 
    data: users = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['organization-team-members', currentUser?.organizationId],
    queryFn: fetchTeamMembers,
    enabled: !!currentUser?.organizationId,
    staleTime: 10000, // Reduced from default for immediate updates
    gcTime: 60000, // Reduced cache time
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Set up real-time subscription for team member changes
  useEffect(() => {
    if (!currentUser?.organizationId) return;

    console.log('useOrganizationTeamMembers: Setting up real-time subscription');
    
    const channel = supabase
      .channel('team-members-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `organization_id=eq.${currentUser.organizationId}`
        },
        (payload) => {
          console.log('useOrganizationTeamMembers: Real-time change detected:', payload);
          
          // Invalidate and refetch team members data
          queryClient.invalidateQueries({ queryKey: ['organization-team-members'] });
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['unified-users'] });
        }
      )
      .subscribe();

    return () => {
      console.log('useOrganizationTeamMembers: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.organizationId, queryClient]);

  return {
    users,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch
  };
};
