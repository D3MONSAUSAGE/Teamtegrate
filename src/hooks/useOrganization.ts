
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export const useOrganization = () => {
  const { user } = useAuth();

  const fetchOrganization = async (): Promise<Organization | null> => {
    if (!user?.organizationId) {
      return null;
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.organizationId)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      throw new Error(error.message);
    }

    return data;
  };

  return useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: fetchOrganization,
    enabled: !!user?.organizationId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
