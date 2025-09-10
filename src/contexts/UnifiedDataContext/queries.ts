import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, Project, User } from '@/types';
import { useEffect } from 'react';

interface QueryOptions {
  user: any;
  networkStatus: string;
  setRequestsInFlight: (fn: (count: number) => number) => void;
  isReady?: boolean;
}

export const useTasksQuery = ({ user, networkStatus, setRequestsInFlight, isReady = true }: QueryOptions) => {
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['unified-tasks', user?.organizationId, user?.id],
    queryFn: async (): Promise<Task[]> => {
      if (!user?.organizationId || !user?.id) {
        console.log('🚫 UnifiedDataContext: Missing user data for tasks query', {
          hasUser: !!user,
          organizationId: user?.organizationId,
          userId: user?.id
        });
        return [];
      }

      console.log('🔄 UnifiedDataContext: Fetching MY TASKS via RLS filtering');
      setRequestsInFlight(count => count + 1);

      try {
        // Let RLS policies handle all the filtering - this will only return tasks the user can access
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('organization_id', user.organizationId)
          .order('created_at', { ascending: false });

        if (tasksError) {
          console.error('❌ UnifiedDataContext: Tasks query error:', tasksError);
          throw new Error(tasksError.message);
        }

        console.log(`📊 UnifiedDataContext: Retrieved ${tasksData?.length || 0} tasks (RLS filtered)`);

        if (!tasksData || tasksData.length === 0) {
          return [];
        }

        // Fetch users for name lookup
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('organization_id', user.organizationId);

        // Create user lookup map
        const userLookup = new Map();
        if (usersData) {
          usersData.forEach(userData => {
            userLookup.set(userData.id, userData.name || userData.email);
          });
        }

        // Transform tasks to app format
        const transformedTasks: Task[] = tasksData.map(task => {
          // Handle assignment data
          let assignedToId = undefined;
          let assignedToName = undefined;
          let assignedToIds = [];
          let assignedToNames = [];

          if (task.assigned_to_ids && Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.length > 0) {
            assignedToIds = task.assigned_to_ids
              .filter(id => id && id.toString().trim() !== '')
              .map(id => id.toString());

            if (assignedToIds.length > 0) {
              assignedToNames = assignedToIds.map(id => {
                return userLookup.get(id) || 'Unknown User';
              });

              if (assignedToIds.length === 1) {
                assignedToId = assignedToIds[0];
                assignedToName = assignedToNames[0];
              }
            }
          } else if (task.assigned_to_id && task.assigned_to_id.toString().trim() !== '') {
            assignedToId = task.assigned_to_id.toString();
            assignedToIds = [assignedToId];
            assignedToName = userLookup.get(assignedToId) || 'Assigned User';
            assignedToNames = [assignedToName];
          }

          return {
            id: task.id || 'unknown',
            userId: task.user_id || '',
            projectId: task.project_id,
            title: task.title || 'Untitled Task',
            description: task.description || '',
            deadline: task.deadline ? new Date(task.deadline) : new Date(),
            scheduledStart: task.scheduled_start ? new Date(task.scheduled_start) : undefined,
            scheduledEnd: task.scheduled_end ? new Date(task.scheduled_end) : undefined,
            priority: (task.priority as 'Low' | 'Medium' | 'High') || 'Medium',
            status: (task.status as 'To Do' | 'In Progress' | 'Completed') || 'To Do',
            createdAt: task.created_at ? new Date(task.created_at) : new Date(),
            updatedAt: task.updated_at ? new Date(task.updated_at) : new Date(),
            assignedToId,
            assignedToName,
            assignedToIds,
            assignedToNames,
            cost: Number(task.cost) || 0,
            organizationId: task.organization_id,
            tags: [],
            comments: []
          };
        });

        console.log('✅ UnifiedDataContext: Successfully processed tasks:', transformedTasks.length);
        return transformedTasks;
      } finally {
        setRequestsInFlight(count => count - 1);
      }
    },
    enabled: !!user?.organizationId && !!user?.id && networkStatus !== 'offline' && isReady,
    staleTime: 30000,
    gcTime: 300000,
    retry: networkStatus === 'healthy' ? 3 : 1,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  return {
    tasks,
    isLoadingTasks: isLoading,
    tasksError: error,
    refetchTasksQuery: refetch
  };
};

export const useProjectsQuery = ({ user, networkStatus, setRequestsInFlight, isReady = true }: QueryOptions) => {
  const { data: projects = [], isLoading, error, refetch } = useQuery({
    queryKey: ['unified-projects', user?.organizationId],
    queryFn: async (): Promise<Project[]> => {
      if (!user?.organizationId) {
        console.log('🚫 UnifiedDataContext: Missing organization data for projects query');
        return [];
      }

      console.log('🔄 UnifiedDataContext: Fetching projects');
      setRequestsInFlight(count => count + 1);

      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('organization_id', user.organizationId)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error('❌ UnifiedDataContext: Projects query error:', projectsError);
          throw new Error(projectsError.message);
        }

        console.log(`📊 UnifiedDataContext: Retrieved ${projectsData?.length || 0} projects`);
        
        // Transform projects to app format
        const transformedProjects: Project[] = (projectsData || []).map(project => ({
          id: project.id,
          title: project.title || 'Untitled Project',
          description: project.description || '',
          startDate: project.start_date || new Date().toISOString().split('T')[0],
          endDate: project.end_date || new Date().toISOString().split('T')[0],
          status: (project.status as 'To Do' | 'In Progress' | 'Completed' | 'On Hold') || 'To Do',
          budget: Number(project.budget) || 0,
          budgetSpent: Number(project.budget_spent) || 0,
          managerId: project.manager_id || '',
          teamMemberIds: project.team_members || [],
          tags: project.tags || [],
          createdAt: project.created_at || new Date().toISOString(),
          updatedAt: project.updated_at || new Date().toISOString(),
          isCompleted: Boolean(project.is_completed) || false,
          organizationId: project.organization_id,
          tasksCount: Number(project.tasks_count) || 0
        }));

        return transformedProjects;
      } finally {
        setRequestsInFlight(count => count - 1);
      }
    },
    enabled: !!user?.organizationId && networkStatus !== 'offline' && isReady,
    staleTime: 30000,
    gcTime: 300000,
    retry: networkStatus === 'healthy' ? 3 : 1,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  return {
    projects,
    isLoadingProjects: isLoading,
    projectsError: error,
    refetchProjectsQuery: refetch
  };
};

export const useUsersQuery = ({ user, networkStatus, setRequestsInFlight, isReady = true }: QueryOptions) => {
  const queryClient = useQueryClient();
  
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['unified-users', user?.organizationId],
    queryFn: async (): Promise<User[]> => {
      if (!user?.organizationId) {
        console.log('🚫 UnifiedDataContext: Missing organization data for users query');
        return [];
      }

      console.log('🔄 UnifiedDataContext: Fetching users');
      setRequestsInFlight(count => count + 1);

      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, role, organization_id, created_at')
          .eq('organization_id', user.organizationId)
          .order('created_at', { ascending: false });

        if (usersError) {
          console.error('❌ UnifiedDataContext: Users query error:', usersError);
          throw new Error(usersError.message);
        }

        console.log(`📊 UnifiedDataContext: Retrieved ${usersData?.length || 0} users`);
        
        // Transform users to app format
        const transformedUsers: User[] = (usersData || []).map(userData => ({
          id: userData.id,
          name: userData.name || 'User',
          email: userData.email || '',
          role: userData.role as User['role'],
          organizationId: userData.organization_id,
          createdAt: new Date(userData.created_at || new Date()),
          timezone: 'UTC'
        }));

        return transformedUsers;
      } finally {
        setRequestsInFlight(count => count - 1);
      }
    },
    enabled: !!user?.organizationId && networkStatus !== 'offline' && isReady,
    staleTime: 10000,
    gcTime: 60000,
    refetchOnWindowFocus: true,
    retry: networkStatus === 'healthy' ? 3 : 1,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  // Set up real-time subscription for users in UnifiedDataContext
  useEffect(() => {
    if (!user?.organizationId || !isReady) return;

    console.log('🔄 UnifiedDataContext: Setting up real-time users subscription');
    
    // Debounce invalidations to prevent cascade
    let debounceTimer: NodeJS.Timeout;
    
    const channel = supabase
      .channel('unified-users-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `organization_id=eq.${user.organizationId}`
        },
        (payload) => {
          console.log('🔄 UnifiedDataContext: Real-time user change:', payload);
          
          // Filter out non-user profile changes to avoid cascades
          const isProfileChange = payload.eventType === 'UPDATE' && (
            payload.old && payload.new && (
              payload.old.name !== payload.new.name ||
              payload.old.email !== payload.new.email ||
              payload.old.role !== payload.new.role
            )
          );
          
          const isUserManagement = payload.eventType === 'INSERT' || payload.eventType === 'DELETE';
          
          // Only invalidate for actual user profile/management changes
          if (isProfileChange || isUserManagement) {
            // Clear existing timer
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }
            
            // Debounce invalidations
            debounceTimer = setTimeout(() => {
              // Only invalidate unified users, not all user queries
              queryClient.invalidateQueries({ 
                queryKey: ['unified-users', user.organizationId],
                exact: false
              });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 UnifiedDataContext: Cleaning up users real-time subscription');
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      supabase.removeChannel(channel);
    };
  }, [user?.organizationId, queryClient, isReady]);

  return {
    users,
    isLoadingUsers: isLoading,
    usersError: error,
    refetchUsersQuery: refetch
  };
};
