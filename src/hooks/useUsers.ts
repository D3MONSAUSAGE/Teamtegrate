
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppUser } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';

export const useUsers = () => {
  const fetchUsers = async (): Promise<AppUser[]> => {
    console.log('Fetching users from Supabase...');
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, avatar_url')
      .order('name');
    
    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(error.message);
    }
    
    console.log(`Successfully loaded ${data?.length || 0} users`);
    return data as AppUser[];
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
    onError: (err: Error) => {
      console.error('Error in useUsers hook:', err);
      toast.error('Failed to load users');
    }
  });
  
  return { 
    users, 
    isLoading, 
    error: error ? (error as Error).message : null,
    refetchUsers: refetch
  };
};
