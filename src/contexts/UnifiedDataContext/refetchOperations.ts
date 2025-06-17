
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { debounce } from '@/utils/requestManager';

interface RefetchOperationsProps {
  user?: {
    id?: string;
    organizationId?: string;
  };
  networkStatus: 'healthy' | 'degraded' | 'offline';
  refetchTasksQuery: () => Promise<any>;
  refetchProjectsQuery: () => Promise<any>;
  refetchUsersQuery: () => Promise<any>;
}

export const useRefetchOperations = ({
  user,
  networkStatus,
  refetchTasksQuery,
  refetchProjectsQuery,
  refetchUsersQuery
}: RefetchOperationsProps) => {
  const queryClient = useQueryClient();

  // Debounced invalidation to prevent excessive refetching
  const debouncedInvalidateTask = useCallback(
    debounce(async () => {
      await queryClient.invalidateQueries({ 
        queryKey: ['unified-tasks', user?.organizationId, user?.id] 
      });
    }, 1000),
    [queryClient, user?.organizationId, user?.id]
  );

  const debouncedInvalidateProjects = useCallback(
    debounce(async () => {
      await queryClient.invalidateQueries({ 
        queryKey: ['unified-projects', user?.organizationId, user?.id] 
      });
    }, 2000), // Longer debounce for projects as they change less frequently
    [queryClient, user?.organizationId, user?.id]
  );

  // Smart refetch that only invalidates what's necessary
  const refetchTasks = useCallback(async () => {
    if (networkStatus === 'offline') return;
    
    try {
      // Only invalidate if data is stale
      const taskCache = queryClient.getQueryData(['unified-tasks', user?.organizationId, user?.id]);
      if (!taskCache) {
        await refetchTasksQuery();
      } else {
        await debouncedInvalidateTask();
      }
    } catch (error) {
      console.error('Error refetching tasks:', error);
    }
  }, [refetchTasksQuery, debouncedInvalidateTask, queryClient, user?.organizationId, user?.id, networkStatus]);

  const refetchProjects = useCallback(async () => {
    if (networkStatus === 'offline') return;
    
    try {
      const projectCache = queryClient.getQueryData(['unified-projects', user?.organizationId, user?.id]);
      if (!projectCache) {
        await refetchProjectsQuery();
      } else {
        await debouncedInvalidateProjects();
      }
    } catch (error) {
      console.error('Error refetching projects:', error);
    }
  }, [refetchProjectsQuery, debouncedInvalidateProjects, queryClient, user?.organizationId, user?.id, networkStatus]);

  const refetchUsers = useCallback(async () => {
    if (networkStatus === 'offline') return;
    
    try {
      // Users change infrequently, so we can be more conservative
      const userCache = queryClient.getQueryData(['unified-users', user?.organizationId]);
      const cacheTime = queryClient.getQueryState(['unified-users', user?.organizationId])?.dataUpdatedAt;
      const now = Date.now();
      
      // Only refetch if cache is older than 5 minutes
      if (!userCache || !cacheTime || (now - cacheTime) > 300000) {
        await refetchUsersQuery();
      }
    } catch (error) {
      console.error('Error refetching users:', error);
    }
  }, [refetchUsersQuery, queryClient, user?.organizationId, networkStatus]);

  // Optimized refetch all with batching
  const refetchAll = useCallback(async () => {
    if (networkStatus === 'offline') {
      toast.error('Cannot refresh data while offline');
      return;
    }

    try {
      // Show optimistic loading state
      toast.loading('Refreshing data...');
      
      // Batch invalidations instead of individual refetches
      const invalidationPromises = [];
      
      // Check if we need to invalidate each cache
      const taskCache = queryClient.getQueryData(['unified-tasks', user?.organizationId, user?.id]);
      const projectCache = queryClient.getQueryData(['unified-projects', user?.organizationId, user?.id]);
      const userCache = queryClient.getQueryData(['unified-users', user?.organizationId]);
      
      if (taskCache) {
        invalidationPromises.push(
          queryClient.invalidateQueries({ queryKey: ['unified-tasks', user?.organizationId, user?.id] })
        );
      } else {
        invalidationPromises.push(refetchTasksQuery());
      }
      
      if (projectCache) {
        invalidationPromises.push(
          queryClient.invalidateQueries({ queryKey: ['unified-projects', user?.organizationId, user?.id] })
        );
      } else {
        invalidationPromises.push(refetchProjectsQuery());
      }
      
      // Only refetch users if really needed
      const userCacheTime = queryClient.getQueryState(['unified-users', user?.organizationId])?.dataUpdatedAt;
      if (!userCache || !userCacheTime || (Date.now() - userCacheTime) > 300000) {
        invalidationPromises.push(refetchUsersQuery());
      }
      
      await Promise.allSettled(invalidationPromises);
      
      toast.dismiss();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.dismiss();
      toast.error('Failed to refresh some data');
    }
  }, [refetchTasksQuery, refetchProjectsQuery, refetchUsersQuery, networkStatus, queryClient, user?.organizationId, user?.id]);

  // Selective invalidation for specific data types
  const invalidateTasksOnly = useCallback(() => {
    debouncedInvalidateTask();
  }, [debouncedInvalidateTask]);

  const invalidateProjectsOnly = useCallback(() => {
    debouncedInvalidateProjects();
  }, [debouncedInvalidateProjects]);

  return {
    refetchTasks,
    refetchProjects,
    refetchUsers,
    refetchAll,
    invalidateTasksOnly,
    invalidateProjectsOnly
  };
};
