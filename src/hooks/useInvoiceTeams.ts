import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
  description?: string;
  member_count: number;
}

export const useInvoiceTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user?.organizationId) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        let query = supabase
          .from('team_details')
          .select('id, name, description, member_count')
          .eq('organization_id', user.organizationId)
          .eq('is_active', true);

        // Role-based filtering
        if (user.role === 'manager') {
          // Managers can only see teams they manage
          query = query.eq('manager_id', user.id);
        }
        // Admins and superadmins see all teams (no additional filter)

        const { data, error: fetchError } = await query.order('name');

        if (fetchError) {
          throw fetchError;
        }

        setTeams(data || []);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [user?.organizationId, user?.role, user?.id]);

  return {
    teams,
    isLoading,
    error
  };
};