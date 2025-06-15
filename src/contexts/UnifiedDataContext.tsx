
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Task, Project, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { requestManager } from '@/utils/requestManager';
import { networkManager } from '@/utils/networkManager';
import { toast } from '@/components/ui/sonner';

interface UnifiedDataContextType {
  // Data
  tasks: Task[];
  projects: Project[];
  users: User[];
  
  // Loading states
  isLoadingTasks: boolean;
  isLoadingProjects: boolean;
  isLoadingUsers: boolean;
  isLoadingAny: boolean;
  
  // Error states
  tasksError: string | null;
  projectsError: string | null;
  usersError: string | null;
  
  // Network status
  networkStatus: 'healthy' | 'degraded' | 'offline';
  requestsInFlight: number;
  
  // Actions
  refetchTasks: () => Promise<void>;
  refetchProjects: () => Promise<void>;
  refetchUsers: () => Promise<void>;
  refetchAll: () => Promise<void>;
}

const UnifiedDataContext = createContext<UnifiedDataContextType | undefined>(undefined);

export const useUnifiedData = () => {
  const context = useContext(UnifiedDataContext);
  if (!context) {
    throw new Error('useUnifiedData must be used within a UnifiedDataProvider');
  }
  return context;
};

export const UnifiedDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [networkStatus, setNetworkStatus] = useState<'healthy' | 'degraded' | 'offline'>('healthy');
  const [requestsInFlight, setRequestsInFlight] = useState(0);

  // Monitor network health
  useEffect(() => {
    const checkNetworkHealth = () => {
      const failureRate = networkManager.getFailureRate();
      const avgResponseTime = networkManager.getAverageResponseTime();
      
      if (failureRate > 0.5 || avgResponseTime > 10000) {
        setNetworkStatus('degraded');
      } else if (failureRate > 0.8) {
        setNetworkStatus('offline');
      } else {
        setNetworkStatus('healthy');
      }
    };

    const interval = setInterval(checkNetworkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Unified task fetching
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasksQuery
  } = useQuery({
    queryKey: ['unified-tasks', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      
      return await networkManager.withNetworkResilience(
        'fetch-tasks',
        async () => {
          setRequestsInFlight(prev => prev + 1);
          try {
            const { data, error } = await supabase
              .from('tasks')
              .select('*')
              .eq('organization_id', user.organizationId)
              .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
          } finally {
            setRequestsInFlight(prev => prev - 1);
          }
        }
      );
    },
    enabled: !!user?.organizationId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (networkStatus === 'offline') return false;
      return failureCount < 2;
    }
  });

  // Unified project fetching
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjectsQuery
  } = useQuery({
    queryKey: ['unified-projects', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      
      return await networkManager.withNetworkResilience(
        'fetch-projects',
        async () => {
          setRequestsInFlight(prev => prev + 1);
          try {
            const { data, error } = await supabase
              .from('projects')
              .select('*')
              .eq('organization_id', user.organizationId)
              .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
          } finally {
            setRequestsInFlight(prev => prev - 1);
          }
        }
      );
    },
    enabled: !!user?.organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes (projects change less frequently)
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (networkStatus === 'offline') return false;
      return failureCount < 2;
    }
  });

  // Unified user fetching
  const {
    data: users = [],
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

  // Coordinated refetch functions
  const refetchTasks = useCallback(async () => {
    await refetchTasksQuery();
  }, [refetchTasksQuery]);

  const refetchProjects = useCallback(async () => {
    await refetchProjectsQuery();
  }, [refetchProjectsQuery]);

  const refetchUsers = useCallback(async () => {
    await refetchUsersQuery();
  }, [refetchUsersQuery]);

  const refetchAll = useCallback(async () => {
    if (networkStatus === 'offline') {
      toast.error('Cannot refresh data while offline');
      return;
    }

    try {
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
  }, [refetchTasksQuery, refetchProjectsQuery, refetchUsersQuery, networkStatus]);

  const value = useMemo(() => ({
    // Data
    tasks,
    projects,
    users,
    
    // Loading states
    isLoadingTasks,
    isLoadingProjects,
    isLoadingUsers,
    isLoadingAny: isLoadingTasks || isLoadingProjects || isLoadingUsers,
    
    // Error states
    tasksError: tasksError ? (tasksError as Error).message : null,
    projectsError: projectsError ? (projectsError as Error).message : null,
    usersError: usersError ? (usersError as Error).message : null,
    
    // Network status
    networkStatus,
    requestsInFlight,
    
    // Actions
    refetchTasks,
    refetchProjects,
    refetchUsers,
    refetchAll
  }), [
    tasks, projects, users,
    isLoadingTasks, isLoadingProjects, isLoadingUsers,
    tasksError, projectsError, usersError,
    networkStatus, requestsInFlight,
    refetchTasks, refetchProjects, refetchUsers, refetchAll
  ]);

  return (
    <UnifiedDataContext.Provider value={value}>
      {children}
    </UnifiedDataContext.Provider>
  );
};
