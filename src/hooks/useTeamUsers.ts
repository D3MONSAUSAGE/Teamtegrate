import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';

export const useTeamUsers = (selectedTeamId?: string | null) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!currentUser?.organizationId) return;

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('users')
        .select('*')
        .eq('organization_id', currentUser.organizationId)
        .order('name');

      // If a specific team is selected and it's not 'all', filter by team
      if (selectedTeamId && selectedTeamId !== 'all') {
        // Join with team_memberships to filter by team
        query = supabase
          .from('users')
          .select(`
            *,
            team_memberships!inner(team_id)
          `)
          .eq('organization_id', currentUser.organizationId)
          .eq('team_memberships.team_id', selectedTeamId)
          .order('name');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      // Map the database user format to our User type
      const mappedUsers: User[] = (data || []).map(dbUser => ({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role as any,
        organizationId: dbUser.organization_id,
        createdAt: new Date(dbUser.created_at),
        avatarUrl: dbUser.avatar_url,
        timezone: dbUser.timezone,
        dailyEmailEnabled: dbUser.daily_email_enabled,
        dailyEmailTime: dbUser.daily_email_time,
        pushToken: dbUser.push_token
      }));
      
      setUsers(mappedUsers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Fetch users error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users when component mounts or team selection changes
  useEffect(() => {
    fetchUsers();
  }, [currentUser?.organizationId, selectedTeamId]);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers
  };
};