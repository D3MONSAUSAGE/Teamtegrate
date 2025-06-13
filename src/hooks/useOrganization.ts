
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useOrganization = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) {
        throw new Error('No organization ID available');
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, created_at')
        .eq('id', user.organizationId)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaced cacheTime)
  });
};
