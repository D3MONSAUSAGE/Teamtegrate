
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';

export const useUsers = () => {
  const fetchUsers = async (): Promise<User[]> => {
    console.log('Fetching users from Supabase...');
    
    // The RLS policies will automatically filter users to only show those in the same organization
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, avatar_url, organization_id, created_at')
      .order('name');
    
    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(error.message);
    }
    
    console.log(`Successfully loaded ${data?.length || 0} users from same organization`);
    
    // Ensure role is properly typed and createdAt is transformed
    return data?.map(user => ({
      ...user,
      role: user.role as UserRole,
      createdAt: new Date(user.created_at),
      name: user.name || user.email || 'Unknown User' // Provide fallback for name
    })) as User[] || [];
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
