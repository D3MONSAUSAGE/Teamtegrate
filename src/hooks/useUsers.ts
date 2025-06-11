
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppUser, UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';

export const useUsers = () => {
  const fetchUsers = async (): Promise<AppUser[]> => {
    console.log('Fetching users from Supabase...');
    
    // The RLS policies will automatically filter users to only show those in the same organization
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, avatar_url, organization_id')
      .order('name');
    
    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(error.message);
    }
    
    console.log(`Successfully loaded ${data?.length || 0} users from same organization`);
    
    // Ensure role is properly typed
    return data?.map(user => ({
      ...user,
      role: user.role as UserRole
    })) as AppUser[] || [];
  };

  const { 
    data: users = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
