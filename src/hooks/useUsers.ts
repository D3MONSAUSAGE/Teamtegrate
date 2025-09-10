
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mapDbUserToApp } from '@/utils/typeCompatibility';
import { useAuth } from '@/contexts/AuthContext';
import { validateUUID } from '@/utils/uuidValidation';

export const useUsers = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const fetchUsers = async (): Promise<User[]> => {
    console.log('Fetching users from Supabase...');
    console.log('Current user role:', currentUser?.role);
    console.log('Current user org:', currentUser?.organizationId);
    
    // Validate organization ID before making request
    const validOrgId = validateUUID(currentUser?.organizationId);
    if (!validOrgId) {
      console.error('useUsers: Invalid organization ID:', currentUser?.organizationId);
      throw new Error('Invalid organization configuration');
    }
    
    let query = supabase
      .from('users')
      .select('id, name, email, role, avatar_url, organization_id, created_at');

    // If user is superadmin, get all users in their organization
    if (currentUser?.role === 'superadmin' && validOrgId) {
      query = query.eq('organization_id', validOrgId);
    } else {
      // For non-superadmins, use default RLS filtering
      query = query.order('name');
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(error.message);
    }
    
    console.log(`Successfully loaded ${data?.length || 0} users from organization`);
    
    // Ensure we always return an array
    if (!Array.isArray(data)) {
      console.warn('useUsers: Data is not an array, returning empty array');
      return [];
    }
    
    // Transform to User type using mapping utility and validate UUIDs
    const mappedUsers = data
      .filter(dbUser => {
        // Validate that user has proper UUID format
        const validUserId = validateUUID(dbUser.id);
        const validUserOrgId = validateUUID(dbUser.organization_id);
        
        if (!validUserId || !validUserOrgId) {
          console.warn('useUsers: Filtering out user with invalid UUID:', dbUser);
          return false;
        }
        
        return true;
      })
      .map(dbUser => mapDbUserToApp(dbUser)) as User[];
    
    console.log('Mapped users:', mappedUsers.length);
    
    return mappedUsers;
  };

  const { 
    data: users = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['users', currentUser?.organizationId, currentUser?.role],
    queryFn: fetchUsers,
    staleTime: 10000,
    gcTime: 60000,
    enabled: !!currentUser?.organizationId && !!validateUUID(currentUser.organizationId),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    meta: {
      onError: (err: Error) => {
        console.error('Error in useUsers hook:', err);
        toast.error('Failed to load users from your organization');
      }
    }
  });

  // Set up real-time subscription for user changes
  useEffect(() => {
    if (!currentUser?.organizationId) return;

    console.log('Setting up real-time subscription for users...');
    
    // Debounce invalidations to prevent rapid successive calls
    let debounceTimer: NodeJS.Timeout;
    
    const channel = supabase
      .channel('users-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'users',
          filter: `organization_id=eq.${currentUser.organizationId}`
        },
        (payload) => {
          console.log('Real-time user change detected:', payload);
          
          // Clear existing timer
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          
          // Debounce invalidations to prevent cascade
          debounceTimer = setTimeout(() => {
            // Only invalidate specific user queries, not all queries containing 'users'
            queryClient.invalidateQueries({ 
              queryKey: ['users', currentUser.organizationId, currentUser.role],
              exact: false 
            });
          }, 100);
          
          // Show toast notification for new users
          if (payload.eventType === 'INSERT' && payload.new) {
            toast.success(`New user ${payload.new.name || payload.new.email} joined your organization`);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up users real-time subscription');
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      supabase.removeChannel(channel);
    };
  }, [currentUser?.organizationId, queryClient]);

  // Manual refresh function
  const refreshUsers = async () => {
    console.log('Manually refreshing users...');
    await queryClient.invalidateQueries({ queryKey: ['users'] });
    return refetch();
  };
  
  return { 
    users: Array.isArray(users) ? users : [], // Ensure always array
    isLoading, 
    error: error ? (error as Error).message : null,
    refetchUsers: refetch,
    refreshUsers
  };
};
