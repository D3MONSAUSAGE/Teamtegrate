import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { userManagementCache } from '@/services/userManagementCache';
import { useCallback, useMemo } from 'react';

export const useOptimizedUserData = () => {
  const { user: currentUser } = useAuth();

  // Optimized query with caching
  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['enhanced-organization-users', currentUser?.organizationId],
    queryFn: async (): Promise<User[]> => {
      if (!currentUser?.organizationId) {
        throw new Error('No organization ID found');
      }

      console.log('🔍 Fetching organization users with optimization...');

      // Check cache first
      const cachedUsers = userManagementCache.getOrganizationUsers(currentUser.organizationId);
      if (cachedUsers) {
        console.log('🗄️ Using cached organization users');
        // Convert cached data back to User format
        return cachedUsers.map(cached => ({
          ...cached,
          organizationId: cached.organization_id,
          createdAt: new Date(), // Convert to Date object
        })) as User[];
      }

      // Fetch from database with optimized query
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          role,
          organizationId:organization_id,
          createdAt:created_at
        `)
        .eq('organization_id', currentUser.organizationId)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching organization users:', error);
        throw error;
      }

      const users = (data || []).map(user => ({
        ...user,
        createdAt: new Date(user.createdAt) // Convert string to Date
      })) as User[];
      console.log(`✅ Fetched ${users.length} organization users`);

      // Cache the results
      const cacheData = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organizationId
      }));
      userManagementCache.setOrganizationUsers(currentUser.organizationId, cacheData);

      return users;
    },
    enabled: !!currentUser?.organizationId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.code === 'PGRST116') return false;
      return failureCount < 2;
    }
  });

  // Memoized user statistics
  const userStats = useMemo(() => {
    const roleCount = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentlyActive = users.length; // Simplified for now, as last_active_at not in basic User type

    return {
      total: users.length,
      roleCount,
      recentlyActive,
      roles: {
        superadmin: roleCount.superadmin || 0,
        admin: roleCount.admin || 0,
        manager: roleCount.manager || 0,
        team_leader: roleCount.team_leader || 0,
        user: roleCount.user || 0
      }
    };
  }, [users]);

  // Optimized refetch with cache invalidation
  const optimizedRefetch = useCallback(() => {
    if (currentUser?.organizationId) {
      userManagementCache.invalidateOrganization(currentUser.organizationId);
    }
    return refetch();
  }, [currentUser?.organizationId, refetch]);

  // User lookup helpers
  const getUserById = useCallback((userId: string) => {
    return users.find(user => user.id === userId);
  }, [users]);

  const getUsersByRole = useCallback((role: string) => {
    return users.filter(user => user.role === role);
  }, [users]);

  const searchUsers = useCallback((query: string) => {
    if (!query.trim()) return users;
    
    const lowercaseQuery = query.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
    );
  }, [users]);

  return {
    users,
    isLoading,
    error,
    userStats,
    refetchUsers: optimizedRefetch,
    getUserById,
    getUsersByRole,
    searchUsers
  };
};