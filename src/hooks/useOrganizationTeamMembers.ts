
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { toast } from '@/components/ui/sonner';

export const useOrganizationTeamMembers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    if (!user?.organizationId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('Fetching all users in organization:', user.organizationId);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, organization_id, created_at, avatar_url, timezone')
        .eq('organization_id', user.organizationId)
        .order('name');

      if (error) {
        console.error('Error fetching organization users:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} users in organization`);
      
      // Convert to User type
      const formattedUsers: User[] = (data || []).map(dbUser => ({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role as any,
        organizationId: dbUser.organization_id,
        timezone: dbUser.timezone || 'UTC',
        avatar_url: dbUser.avatar_url,
        createdAt: new Date(dbUser.created_at)
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load team members');
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
    refetch: fetchUsers
  };
};
