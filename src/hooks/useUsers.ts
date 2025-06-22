
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mapDbUserToApp } from '@/utils/typeCompatibility';
import { useAuth } from '@/contexts/AuthContext';

export const useUsers = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const fetchUsers = async (): Promise<User[]> => {
    console.log('Fetching users from Supabase...');
    console.log('Current user role:', currentUser?.role);
    console.log('Current user org:', currentUser?.organizationId);
    
    // Enhanced query for superadmins to see all users in their organization
    let query = supabase
      .from('users')
      .select('id, name, email, role, avatar_url, organization_id, created_at');

    // If user is superadmin, get all users in their organization
    if (currentUser?.role === 'superadmin' && currentUser?.organizationId) {
      query = query.eq('organization_id', currentUser.organizationId);
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
    console.log('Raw user data:', data);
    
    // Transform to User type using mapping utility
    const mappedUsers = data?.map(dbUser => mapDbUserToApp(dbUser)) as User[] || [];
    console.log('Mapped users:', mappedUsers);
    
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
    staleTime: 10000, // Reduced from 5 minutes to 10 seconds for immediate updates
    gcTime: 60000, // Reduced cache time to 1 minute
    enabled: !!currentUser?.organizationId,
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
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
          
          // Invalidate and refetch users data
          queryClient.invalidateQueries({ queryKey: ['users'] });
          
          // Show toast notification for new users
          if (payload.eventType === 'INSERT' && payload.new) {
            toast.success(`New user ${payload.new.name || payload.new.email} joined your organization`);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up users real-time subscription');
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
    users, 
    isLoading, 
    error: error ? (error as Error).message : null,
    refetchUsers: refetch,
    refreshUsers
  };
};
