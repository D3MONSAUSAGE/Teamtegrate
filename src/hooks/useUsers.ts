
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppUser } from '@/types';

export const useUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role')
          .order('name');
          
        if (error) {
          console.error('Error loading users:', error);
          return;
        }
        
        if (data) {
          setUsers(data);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  return { users, isLoading };
};
