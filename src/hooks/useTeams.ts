
// Simple teams hook to avoid creating a new file
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface Team {
  id: string;
  name: string;
  description?: string;
  manager_name?: string;
  member_count: number;
  is_active: boolean;
}

export const useTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    if (!user?.organizationId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('team_details')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setTeams(data || []);
    } catch (err) {
      logger.error('Error fetching teams', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user?.organizationId]);

  return {
    teams,
    isLoading,
    error,
    refetch: fetchTeams
  };
};
