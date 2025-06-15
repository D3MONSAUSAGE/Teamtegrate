import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { networkManager } from '@/utils/networkManager';
import { transformDbTaskToAppTask, transformDbProjectToAppProject, transformDbUserToAppUser } from './transformers';
import { useMemo } from 'react';

interface QueryOptions {
  user?: {
    id?: string;
    organizationId?: string;
  };
  networkStatus: 'healthy' | 'degraded' | 'offline';
  setRequestsInFlight: (fn: (prev: number) => number) => void;
}

export const useTasksQuery = ({ user, networkStatus, setRequestsInFlight }: QueryOptions) => {
  const {
    data: rawTasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasksQuery
  } = useQuery({
    queryKey: ['unified-tasks', user?.organizationId, user?.id],
    queryFn: async () => {
      if (!user?.organizationId || !user?.id) return [];
      
      return await networkManager.withNetworkResilience(
        'fetch-tasks',
        async () => {
          setRequestsInFlight(prev => prev + 1);
          try {
            // Filter tasks to only show those created by or assigned to the current user
            const { data, error } = await supabase
              .from('tasks')
              .select('*')
              .eq('organization_id', user.organizationId)
              .or(`user_id.eq.${user.id},assigned_to_id.eq.${user.id},assigned_to_ids.cs.{${user.id}}`)
              .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
          } finally {
            setRequestsInFlight(prev => prev - 1);
          }
        }
      );
    },
    enabled: !!user?.organizationId && !!user?.id,
    staleTime: 0, // Always consider data stale for real-time updates
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time feel
    retry: (failureCount, error) => {
      if (networkStatus === 'offline') return false;
      return failureCount < 2;
    }
  });

  // Transform raw tasks to app format
  const tasks = useMemo(() => {
    return rawTasks.map(task => transformDbTaskToAppTask(task, user));
  }, [rawTasks, user?.id, user?.organizationId]);

  return {
    tasks,
    isLoadingTasks,
    tasksError,
    refetchTasksQuery
  };
};

export const useProjectsQuery = ({ user, networkStatus, setRequestsInFlight }: QueryOptions) => {
  const {
    data: rawProjects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjectsQuery
  } = useQuery({
    queryKey: ['unified-projects', user?.organizationId, user?.id],
    queryFn: async () => {
      if (!user?.organizationId || !user?.id) return [];
      
      return await networkManager.withNetworkResilience(
        'fetch-projects',
        async () => {
          setRequestsInFlight(prev => prev + 1);
          try {
            // Filter projects to only show those managed by user or where user is a team member
            const { data, error } = await supabase
              .from('projects')
              .select('*')
              .eq('organization_id', user.organizationId)
              .or(`manager_id.eq.${user.id},team_members.cs.{${user.id}}`)
              .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
          } finally {
            setRequestsInFlight(prev => prev - 1);
          }
        }
      );
    },
    enabled: !!user?.organizationId && !!user?.id,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (networkStatus === 'offline') return false;
      return failureCount < 2;
    }
  });

  // Transform raw projects to app format
  const projects = useMemo(() => {
    return rawProjects.map(project => transformDbProjectToAppProject(project, user));
  }, [rawProjects, user?.organizationId]);

  return {
    projects,
    isLoadingProjects,
    projectsError,
    refetchProjectsQuery
  };
};

export const useUsersQuery = ({ user, networkStatus, setRequestsInFlight }: QueryOptions) => {
  const {
    data: rawUsers = [],
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsersQuery
  } = useQuery({
    queryKey: ['unified-users', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      
      return await networkManager.withNetworkResilience(
        'fetch-users',
        async () => {
          setRequestsInFlight(prev => prev + 1);
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('organization_id', user.organizationId)
              .order('name');

            if (error) throw error;
            return data || [];
          } finally {
            setRequestsInFlight(prev => prev - 1);
          }
        }
      );
    },
    enabled: !!user?.organizationId,
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (networkStatus === 'offline') return false;
      return failureCount < 2;
    }
  });

  // Transform raw users to app format
  const users = useMemo(() => {
    return rawUsers.map(transformDbUserToAppUser);
  }, [rawUsers]);

  return {
    users,
    isLoadingUsers,
    usersError,
    refetchUsersQuery
  };
};
