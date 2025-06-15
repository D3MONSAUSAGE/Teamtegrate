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

  // Transform database task to app Task type
  const transformDbTaskToAppTask = (dbTask: any): Task => {
    return {
      id: String(dbTask.id || ''),
      userId: String(dbTask.user_id || user?.id || ''),
      projectId: dbTask.project_id ? String(dbTask.project_id) : undefined,
      title: String(dbTask.title || ''),
      description: String(dbTask.description || ''),
      deadline: new Date(dbTask.deadline || new Date()),
      priority: (['Low', 'Medium', 'High'].includes(dbTask.priority) ? dbTask.priority : 'Medium') as 'Low' | 'Medium' | 'High',
      status: (['To Do', 'In Progress', 'Completed'].includes(dbTask.status) ? dbTask.status : 'To Do') as 'To Do' | 'In Progress' | 'Completed',
      createdAt: new Date(dbTask.created_at || new Date()),
      updatedAt: new Date(dbTask.updated_at || new Date()),
      assignedToId: dbTask.assigned_to_id ? String(dbTask.assigned_to_id) : undefined,
      assignedToName: dbTask.assigned_to_names?.[0] || undefined,
      assignedToIds: dbTask.assigned_to_ids || [],
      assignedToNames: dbTask.assigned_to_names || [],
      tags: [],
      comments: [],
      cost: Number(dbTask.cost) || 0,
      organizationId: String(dbTask.organization_id || user?.organizationId || '')
    };
  };

  // Transform database project to app Project type
  const transformDbProjectToAppProject = (dbProject: any): Project => {
    return {
      id: String(dbProject.id || ''),
      title: String(dbProject.title || ''),
      description: String(dbProject.description || ''),
      startDate: dbProject.start_date ? new Date(dbProject.start_date) : new Date(),
      endDate: dbProject.end_date ? new Date(dbProject.end_date) : new Date(),
      status: (['To Do', 'In Progress', 'Completed'].includes(dbProject.status) ? dbProject.status : 'To Do') as 'To Do' | 'In Progress' | 'Completed',
      budget: Number(dbProject.budget) || 0,
      budgetSpent: Number(dbProject.budget_spent) || 0,
      managerId: String(dbProject.manager_id || ''),
      teamMemberIds: dbProject.team_members || [],
      tags: dbProject.tags || [],
      createdAt: dbProject.created_at ? new Date(dbProject.created_at) : new Date(),
      updatedAt: dbProject.updated_at ? new Date(dbProject.updated_at) : new Date(),
      isCompleted: Boolean(dbProject.is_completed) || false,
      organizationId: String(dbProject.organization_id || user?.organizationId || ''),
      tasksCount: Number(dbProject.tasks_count) || 0
    };
  };

  // Transform database user to app User type
  const transformDbUserToAppUser = (dbUser: any): User => {
    return {
      id: String(dbUser.id || ''),
      email: String(dbUser.email || ''),
      role: dbUser.role as User['role'],
      organizationId: String(dbUser.organization_id || ''),
      name: String(dbUser.name || ''),
      timezone: String(dbUser.timezone || 'UTC'),
      createdAt: new Date(dbUser.created_at || new Date()),
      avatar_url: dbUser.avatar_url || undefined
    };
  };

  // Unified task fetching with user-specific filtering
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
    return rawTasks.map(transformDbTaskToAppTask);
  }, [rawTasks, user?.id, user?.organizationId]);

  // Unified project fetching with more aggressive real-time settings
  const {
    data: rawProjects = [],
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
    return rawProjects.map(transformDbProjectToAppProject);
  }, [rawProjects, user?.organizationId]);

  // Unified user fetching
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

  // Enhanced coordinated refetch functions with immediate invalidation
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
