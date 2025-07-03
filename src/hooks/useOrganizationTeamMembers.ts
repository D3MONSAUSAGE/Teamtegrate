
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

    // Validate organization ID format
    const orgId = currentUser.organizationId.trim();
    if (!orgId || orgId.length === 0) {
      console.log('useOrganizationTeamMembers: Empty organization ID');
      return [];
    }

    console.log('useOrganizationTeamMembers: Fetching team members for organization:', orgId);

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, organization_id, created_at, avatar_url')
      .eq('organization_id', orgId)
      .order('name');

    if (error) {
      console.error('useOrganizationTeamMembers: Error fetching team members:', error);
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }

    console.log(`useOrganizationTeamMembers: Successfully loaded ${data?.length || 0} team members`);

    // Transform to User type with validation
    const transformedUsers: User[] = (data || [])
      .filter(user => user && user.id && user.email) // Filter out invalid users
      .map(user => ({
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
    enabled: !!currentUser?.organizationId && currentUser.organizationId.trim().length > 0,
    staleTime: 10000,
    gcTime: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Set up real-time subscription for team member changes
  useEffect(() => {
    if (!currentUser?.organizationId || currentUser.organizationId.trim().length === 0) return;

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
    users: Array.isArray(users) ? users : [], // Always return an array
    isLoading,
    error: error ? (error as Error).message : null,
    refetch
  };
};
