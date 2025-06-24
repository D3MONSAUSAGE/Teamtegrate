
import React, { createContext, useContext, useMemo } from 'react';
import { Task, Project, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTasksQuery, useProjectsQuery, useUsersQuery } from './UnifiedDataContext/queries';
import { useNetworkMonitoring } from './UnifiedDataContext/useNetworkMonitoring';
import { useRefetchOperations } from './UnifiedDataContext/refetchOperations';

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
  const { user, isReady } = useAuth();
  
  // Network monitoring
  const { networkStatus, requestsInFlight, setRequestsInFlight } = useNetworkMonitoring();
  
  // Query options - now includes isReady flag
  const queryOptions = {
    user,
    networkStatus,
    setRequestsInFlight,
    isReady
  };
  
  console.log('UnifiedDataContext: Query options', {
    hasUser: !!user,
    organizationId: user?.organizationId,
    isReady,
    networkStatus
  });
  
  // Data queries - will wait for isReady before executing
  const { tasks, isLoadingTasks, tasksError, refetchTasksQuery } = useTasksQuery(queryOptions);
  const { projects, isLoadingProjects, projectsError, refetchProjectsQuery } = useProjectsQuery(queryOptions);
  const { users, isLoadingUsers, usersError, refetchUsersQuery } = useUsersQuery(queryOptions);
  
  // Refetch operations
  const { refetchTasks, refetchProjects, refetchUsers, refetchAll } = useRefetchOperations({
    user,
    networkStatus,
    refetchTasksQuery,
    refetchProjectsQuery,
    refetchUsersQuery
  });

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
