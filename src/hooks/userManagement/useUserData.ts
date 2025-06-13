
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { EnhancedUser } from './types';

export const useUserData = () => {
  const { user: currentUser } = useAuth();

  const { data: users, isLoading: usersLoading, error } = useQuery({
    queryKey: ['enhanced-organization-users', currentUser?.organizationId],
    queryFn: async (): Promise<EnhancedUser[]> => {
      if (!currentUser?.organizationId) {
        throw new Error('User must belong to an organization');
      }

      const { data, error } = await supabase
        .from('organization_user_hierarchy')
        .select('*')
        .eq('organization_id', currentUser.organizationId)
        .order('role_level', { ascending: false })
        .order('name');

      if (error) throw error;

      return data?.map(user => ({
        id: user.id || '',
        name: user.name || '',
        email: user.email || '',
        role: (user.role || 'user') as UserRole,
        organization_id: user.organization_id || '',
        created_at: user.created_at || '',
        assigned_tasks_count: user.assigned_tasks_count || 0,
        completed_tasks_count: user.completed_tasks_count || 0,
        role_level: user.role_level || 0,
        is_active: true,
        last_activity: user.created_at || ''
      })) || [];
    },
    enabled: !!currentUser?.organizationId && currentUser?.role === 'superadmin',
  });

  return {
    users: users || [],
    isLoading: usersLoading,
    error: error ? (error as Error).message : null
  };
};
