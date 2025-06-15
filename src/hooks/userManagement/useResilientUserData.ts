
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { EnhancedUser } from './types';
import { requestManager } from '@/utils/requestManager';

export const useResilientUserData = () => {
  const { user: currentUser } = useAuth();

  // Primary data source - enhanced hierarchy view
  const { data: hierarchyUsers, isLoading: hierarchyLoading, error: hierarchyError } = useQuery({
    queryKey: ['enhanced-organization-users', currentUser?.organizationId],
    queryFn: async (): Promise<EnhancedUser[]> => {
      if (!currentUser?.organizationId) {
        throw new Error('User must belong to an organization');
      }

      const cacheKey = `hierarchy-users-${currentUser.organizationId}`;
      
      return await requestManager.dedupe(cacheKey, async () => {
        console.log('ResilientUserData: Fetching from hierarchy view...');
        
        const { data, error } = await supabase
          .from('organization_user_hierarchy')
          .select('*')
          .eq('organization_id', currentUser.organizationId)
          .order('role_level', { ascending: false })
          .order('name');

        if (error) {
          console.error('ResilientUserData: Hierarchy view error:', error);
          throw error;
        }

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
      });
    },
    enabled: !!currentUser?.organizationId && currentUser?.role === 'superadmin',
    retry: 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fallback data source - basic users table
  const { data: basicUsers, isLoading: basicLoading, error: basicError } = useQuery({
    queryKey: ['basic-organization-users', currentUser?.organizationId],
    queryFn: async (): Promise<EnhancedUser[]> => {
      if (!currentUser?.organizationId) {
        throw new Error('User must belong to an organization');
      }

      const cacheKey = `basic-users-${currentUser.organizationId}`;
      
      return await requestManager.dedupe(cacheKey, async () => {
        console.log('ResilientUserData: Fetching from basic users table...');
        
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role, organization_id, created_at')
          .eq('organization_id', currentUser.organizationId)
          .order('name');

        if (error) {
          console.error('ResilientUserData: Basic users error:', error);
          throw error;
        }

        return data?.map(user => ({
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          role: user.role as UserRole,
          organization_id: user.organization_id,
          created_at: user.created_at,
          assigned_tasks_count: 0,
          completed_tasks_count: 0,
          role_level: this.getRoleLevel(user.role),
          is_active: true,
          last_activity: user.created_at
        })) || [];
      });
    },
    enabled: !!currentUser?.organizationId && currentUser?.role === 'superadmin' && !!hierarchyError,
    retry: 1,
    staleTime: 1000 * 60 * 1, // 1 minute
  });

  // Determine which data to use
  const users = hierarchyUsers || basicUsers || [];
  const isLoading = hierarchyLoading || (hierarchyError && basicLoading);
  const error = hierarchyError && basicError ? 
    `Failed to load user data: ${basicError}` : null;

  const getRoleLevel = (role: string): number => {
    switch (role) {
      case 'superadmin': return 4;
      case 'admin': return 3;
      case 'manager': return 2;
      case 'user': return 1;
      default: return 0;
    }
  };

  return {
    users,
    isLoading,
    error,
    isUsingFallback: !!hierarchyError && !!basicUsers,
    hierarchyError,
    basicError
  };
};
