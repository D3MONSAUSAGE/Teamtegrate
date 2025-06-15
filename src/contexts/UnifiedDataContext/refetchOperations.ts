
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';

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

  const refetchTasks = useCallback(async () => {
    // Immediately invalidate and refetch tasks
    await queryClient.invalidateQueries({ queryKey: ['unified-tasks', user?.organizationId, user?.id] });
    await queryClient.invalidateQueries({ queryKey: ['tasks', user?.organizationId, user?.id] });
    await refetchTasksQuery();
  }, [refetchTasksQuery, queryClient, user?.organizationId, user?.id]);

  const refetchProjects = useCallback(async () => {
    // Immediately invalidate and refetch projects
    await queryClient.invalidateQueries({ queryKey: ['unified-projects', user?.organizationId] });
    await refetchProjectsQuery();
  }, [refetchProjectsQuery, queryClient, user?.organizationId]);

  const refetchUsers = useCallback(async () => {
    await refetchUsersQuery();
  }, [refetchUsersQuery]);

  const refetchAll = useCallback(async () => {
    if (networkStatus === 'offline') {
      toast.error('Cannot refresh data while offline');
      return;
    }

    try {
      // Invalidate all queries first for immediate UI update
      await queryClient.invalidateQueries({ queryKey: ['unified-tasks', user?.organizationId, user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['unified-projects', user?.organizationId] });
      await queryClient.invalidateQueries({ queryKey: ['unified-users', user?.organizationId] });
      await queryClient.invalidateQueries({ queryKey: ['tasks', user?.organizationId, user?.id] });
      
      await Promise.allSettled([
        refetchTasksQuery(),
        refetchProjectsQuery(),
        refetchUsersQuery()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh some data');
    }
  }, [refetchTasksQuery, refetchProjectsQuery, refetchUsersQuery, networkStatus, queryClient, user?.organizationId, user?.id]);

  return {
    refetchTasks,
    refetchProjects,
    refetchUsers,
    refetchAll
  };
};
