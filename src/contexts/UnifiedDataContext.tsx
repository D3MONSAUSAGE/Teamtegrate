import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, Project, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { mapDbUserToApp } from '@/utils/typeCompatibility';
import { validateUUID } from '@/utils/uuidValidation';
import { useQueryClient } from '@tanstack/react-query';

interface UnifiedDataContextType {
  myTasks: Task[];
  isLoadingTasks: boolean;
  tasksError: string | null;
  refetchTasks: () => void;

  projects: Project[];
  isLoadingProjects: boolean;
  projectsError: string | null;
  refetchProjects: () => void;

  users: User[];
  isLoadingUsers: boolean;
  usersError: string | null;
  refetchUsers: () => void;

  refetchAll: () => void;

  isReady: boolean;
  networkStatus: 'healthy' | 'loading' | 'error';
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
  const queryClient = useQueryClient();
  
  // Enhanced query options with validation
  const queryOptions = useMemo(() => {
    const hasValidUser = !!user?.id;
    const hasValidOrgId = !!user?.organizationId && 
                         user.organizationId.trim().length > 0 &&
                         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.organizationId.trim());
    
    const options = {
      hasUser: hasValidUser,
      organizationId: hasValidOrgId ? user.organizationId : undefined,
      isReady,
      networkStatus: 'healthy' as const
    };
    
    console.log('UnifiedDataContext: Query options', options);
    return options;
  }, [user?.id, user?.organizationId, isReady]);

  // Tasks Query
  const {
    data: tasksData,
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery<Task[], Error>({
    queryKey: ['my-tasks', user?.id],
    queryFn: async () => {
      if (!queryOptions.hasUser) {
        console.log('UnifiedDataContext: Skipping tasks query due to invalid user');
        return [];
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id);

      if (error) {
        console.error('UnifiedDataContext: Error fetching tasks:', error);
        throw error;
      }

      return data as Task[];
    },
    enabled: queryOptions.isReady && queryOptions.hasUser,
  });

  // Projects Query
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery<Project[], Error>({
    queryKey: ['my-projects', user?.organizationId],
    queryFn: async () => {
      if (!queryOptions.organizationId) {
        console.log('UnifiedDataContext: Skipping projects query due to invalid org ID');
        return [];
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', queryOptions.organizationId);

      if (error) {
        console.error('UnifiedDataContext: Error fetching projects:', error);
        throw error;
      }

      return data as Project[];
    },
    enabled: queryOptions.isReady && !!queryOptions.organizationId,
  });

  // Users Query
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery<User[], Error>({
    queryKey: ['my-users', user?.organizationId],
    queryFn: async () => {
      if (!queryOptions.organizationId) {
        console.log('UnifiedDataContext: Skipping users query due to invalid org ID');
        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', queryOptions.organizationId);

      if (error) {
        console.error('UnifiedDataContext: Error fetching users:', error);
        throw error;
      }

      // Transform to User type using mapping utility and validate UUIDs
      const mappedUsers = data
        .filter(dbUser => {
          // Validate that user has proper UUID format
          const validUserId = validateUUID(dbUser.id);
          const validUserOrgId = validateUUID(dbUser.organization_id);
        
          if (!validUserId || !validUserOrgId) {
            console.warn('useUsers: Filtering out user with invalid UUID:', dbUser);
            return false;
          }
        
          return true;
        })
        .map(dbUser => mapDbUserToApp(dbUser)) as User[];

      return mappedUsers;
    },
    enabled: queryOptions.isReady && !!queryOptions.organizationId,
  });

  const value: UnifiedDataContextType = {
    // Tasks
    myTasks: tasksData || [],
    isLoadingTasks: isLoadingTasks,
    tasksError: tasksError?.message || null,
    refetchTasks,

    // Projects  
    projects: projectsData || [],
    isLoadingProjects: isLoadingProjects,
    projectsError: projectsError?.message || null,
    refetchProjects,

    // Users
    users: usersData || [],
    isLoadingUsers: isLoadingUsers,
    usersError: usersError?.message || null,
    refetchUsers,

    // Global operations
    refetchAll: () => {
      refetchTasks();
      refetchProjects(); 
      refetchUsers();
    },

    // Query status
    isReady: queryOptions.isReady && queryOptions.hasUser,
    networkStatus: queryOptions.networkStatus
  };

  return (
    <UnifiedDataContext.Provider value={value}>
      {children}
    </UnifiedDataContext.Provider>
  );
};
