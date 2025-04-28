
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppUser } from '@/types';
import { toast } from '@/components/ui/sonner';

export const useUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching users from Supabase...');
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role')
          .order('name');
        
        if (error) {
          console.error('Error fetching users:', error);
          setError(error.message);
          toast.error('Failed to load users');
          return;
        }
        
        if (data) {
          console.log(`Successfully loaded ${data.length} users`);
          setUsers(data as AppUser[]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
        console.error('Error in useUsers hook:', err);
        setError(errorMessage);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  return { users, isLoading, error };
};
