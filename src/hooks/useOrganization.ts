import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Organization } from '@/types';

export const useOrganization = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: async (): Promise<Organization> => {
      if (!user?.organizationId) {
        throw new Error('No organization ID available');
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', user.organizationId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        created_at: new Date(data.created_at)
      };
    },
    enabled: !!user?.organizationId,
  });
};