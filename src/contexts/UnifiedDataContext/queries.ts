
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
    queryKey: ['unified-my-tasks', user?.organizationId, user?.id],
    queryFn: async () => {
      if (!user?.organizationId || !user?.id) return [];
      
      return await networkManager.withNetworkResilience(
        'fetch-my-tasks',
        async () => {
          setRequestsInFlight(prev => prev + 1);
          try {
            // OPTIMIZED QUERY: Only fetch essential fields and use indexes
            const { data, error } = await supabase
              .from('tasks')
              .select('id, title, description, status, priority, deadline, assigned_to_id, assigned_to_ids, project_id, organization_id, created_at, updated_at')
              .eq('organization_id', user.organizationId)
              .or(`assigned_to_id.eq.${user.id},assigned_to_ids.cs.{${user.id}}`)
              .order('created_at', { ascending: false })
              .limit(100); // Limit initial load

            if (error) throw error;
            return data || [];
          } finally {
            setRequestsInFlight(prev => prev - 1);
          }
        }
      );
    },
    enabled: !!user?.organizationId && !!user?.id,
    staleTime: 30000, // Increased to 30 seconds for better performance
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Reduced aggressive refetching
    refetchInterval: 30000, // Reduced from 10s to 30s for performance
    retry: (failureCount, error) => {
      if (networkStatus === 'offline') return false;
      return failureCount < 2;
    }
  });

  // Transform raw tasks to app format with focused filtering
  const tasks = useMemo(() => {
    return rawTasks
      .filter(task => {
        // Additional client-side validation for My Tasks focus
        const isDirectlyAssigned = 
          task.assigned_to_id === user?.id || // Single assignee
          (task.assigned_to_ids && Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.includes(user?.id)); // Multi assignee

        return isDirectlyAssigned;
      })
      .map(task => transformDbTaskToAppTask(task, user));
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
            // OPTIMIZED QUERY: Only fetch essential fields
            const { data, error } = await supabase
              .from('projects')
              .select('id, title, description, status, manager_id, team_members, organization_id, created_at, updated_at, budget, budget_spent, tasks_count')
              .eq('organization_id', user.organizationId)
              .or(`manager_id.eq.${user.id},team_members.cs.{${user.id}}`)
              .order('created_at', { ascending: false })
              .limit(50); // Limit initial load

            if (error) throw error;
            return data || [];
          } finally {
            setRequestsInFlight(prev => prev - 1);
          }
        }
      );
    },
    enabled: !!user?.organizationId && !!user?.id,
    staleTime: 60000, // 1 minute - projects change less frequently
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // No automatic polling for projects
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
            // OPTIMIZED QUERY: Only fetch essential user fields
            const { data, error } = await supabase
              .from('users')
              .select('id, email, name, role, organization_id, avatar_url')
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
    staleTime: 1000 * 60 * 5, // 5 minutes - users change infrequently
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // No automatic polling for users
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
