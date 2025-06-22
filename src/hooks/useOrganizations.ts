
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

export const useOrganizations = () => {
  const { user: currentUser } = useAuth();

  const { data: organizations = [], isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: async (): Promise<Organization[]> => {
      console.log('Fetching all organizations for super admin...');
      
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, created_at, created_by')
        .order('name');

      if (error) {
        console.error('Error fetching organizations:', error);
        throw new Error(error.message);
      }

      console.log(`Loaded ${data?.length || 0} organizations`);
      return data || [];
    },
    enabled: currentUser?.role === 'superadmin',
    staleTime: 30000,
  });

  return {
    organizations,
    isLoading,
    error: error ? (error as Error).message : null,
  };
};
