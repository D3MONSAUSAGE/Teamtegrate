
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';
import { mapDbUserToApp } from '@/utils/typeCompatibility';
import { useAuth } from '@/contexts/AuthContext';

export const useUsers = () => {
  const { user: currentUser } = useAuth();

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
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!currentUser?.organizationId,
    meta: {
      onError: (err: Error) => {
        console.error('Error in useUsers hook:', err);
        toast.error('Failed to load users from your organization');
      }
    }
  });
  
  return { 
    users, 
    isLoading, 
    error: error ? (error as Error).message : null,
    refetchUsers: refetch
  };
};
