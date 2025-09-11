import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { User, UserRole } from '@/types';

export const useUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!user?.organizationId) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, name, email, role, organization_id, created_at, avatar_url')
        .eq('organization_id', user.organizationId)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      // Transform the data to match the User interface
      const transformedUsers: User[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        organizationId: user.organization_id,
        name: user.name,
        createdAt: new Date(user.created_at),
        avatar_url: user.avatar_url,
      }));

      setUsers(transformedUsers);
    } catch (err) {
      logger.error('Error fetching users', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user?.organizationId]);

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers
  };
};