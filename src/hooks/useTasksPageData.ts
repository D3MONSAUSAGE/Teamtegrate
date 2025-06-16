
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import { flatTasksToTasks } from '@/utils/typeConversions';
import { useMemo } from 'react';
import { requestManager } from '@/utils/requestManager';

export const useTasksPageData = () => {
  const { user } = useAuth();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks-my-tasks', user?.organizationId, user?.id],
    queryFn: async (): Promise<Task[]> => {
      if (!user?.organizationId || !user?.id) {
        if (process.env.NODE_ENV === 'development') {
          console.log('useTasksPageData: Missing user data, cannot fetch tasks');
        }
        throw new Error('User must be authenticated and belong to an organization');
      }

      const cacheKey = `my-tasks-${user.organizationId}-${user.id}`;
      
      return requestManager.dedupe(cacheKey, async () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('useTasksPageData: Fetching MY TASKS (directly assigned only) for user:', {
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role
          });
        }

        // FOCUSED QUERY: Only fetch tasks directly assigned to the user
        // Remove broad admin/creator access for My Tasks page
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );

        const taskPromise = supabase
          .from('tasks')
          .select('*')
          .eq('organization_id', user.organizationId)
          .or(`assigned_to_id.eq.${user.id},assigned_to_ids.cs.{${user.id}}`)
          .order('created_at', { ascending: false });

        const { data: tasksData, error: tasksError } = await Promise.race([
          taskPromise,
          timeoutPromise
        ]) as any;

        if (tasksError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('useTasksPageData: Error fetching my tasks:', tasksError);
          }
          
          // Handle specific error types
          if (tasksError.message?.includes('invalid input syntax for type uuid')) {
            throw new Error('Data validation error. Please refresh the page and try again.');
          }
          
          if (tasksError.message?.includes('set-returning functions are not allowed in WHERE')) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('useTasksPageData: RLS function transition in progress, returning empty tasks array');
            }
            return [];
          }

          // Network-related errors
          if (tasksError.message?.includes('Failed to fetch') || 
              tasksError.message?.includes('Network Error') ||
              tasksError.message?.includes('timeout')) {
            throw new Error('Network connection issue. Please check your connection and try again.');
          }
          
          throw new Error(`Failed to fetch my assigned tasks: ${tasksError.message}`);
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`useTasksPageData: Retrieved ${tasksData?.length || 0} directly assigned tasks`);
        }

        if (!tasksData || tasksData.length === 0) {
          return [];
        }

        // Fetch users data only once for name lookup with timeout
        const usersPromise = supabase
          .from('users')
          .select('id, name, email')
          .eq('organization_id', user.organizationId);

        const { data: usersData, error: usersError } = await Promise.race([
          usersPromise,
          timeoutPromise
        ]) as any;

        if (usersError && process.env.NODE_ENV === 'development') {
          console.error('useTasksPageData: Error fetching organization users:', usersError);
        }

        // Create optimized user lookup map
        const userLookup = new Map();
        if (usersData) {
          usersData.forEach(userData => {
            userLookup.set(userData.id, userData.name || userData.email);
          });
        }

        // Process tasks with FOCUSED filtering for My Tasks
        const processedTasks = tasksData
          .filter(task => {
            // Security check: Ensure task belongs to user's organization
            if (task.organization_id !== user.organizationId) {
              if (process.env.NODE_ENV === 'development') {
                console.error('useTasksPageData: Task from different organization filtered out');
              }
              return false;
            }

            // FOCUSED FILTERING: Only tasks directly assigned to the user
            const isDirectlyAssigned = 
              task.assigned_to_id === user.id || // Single assignee
              (task.assigned_to_ids && Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.includes(user.id)); // Multi assignee

            return isDirectlyAssigned;
          })
          .map(task => {
            // Optimized assignment data processing
            let assignedToId = undefined;
            let assignedToName = undefined;
            let assignedToIds = [];
            let assignedToNames = [];

            // Handle assigned_to_ids array with enhanced validation
            if (task.assigned_to_ids && Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.length > 0) {
              assignedToIds = task.assigned_to_ids
                .filter(id => id && id.toString().trim() !== '')
                .map(id => id.toString());

              if (assignedToIds.length > 0) {
                // Use cached names or lookup
                if (task.assigned_to_names && Array.isArray(task.assigned_to_names) && task.assigned_to_names.length > 0) {
                  assignedToNames = task.assigned_to_names
                    .filter(name => name && name.toString().trim() !== '')
                    .map(name => name.toString());
                }

                // Fill missing names from lookup
                if (assignedToNames.length < assignedToIds.length) {
                  assignedToNames = assignedToIds.map((id, index) => {
                    if (index < assignedToNames.length && assignedToNames[index]) {
                      return assignedToNames[index];
                    }
                    return userLookup.get(id) || 'Unknown User';
                  });
                }

                // Single assignment compatibility
                if (assignedToIds.length === 1) {
                  assignedToId = assignedToIds[0];
                  assignedToName = assignedToNames[0];
                }
              }
            }
            // Fallback to single assignment with validation
            else if (task.assigned_to_id && task.assigned_to_id.toString().trim() !== '') {
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
              priority: (task.priority as 'Low' | 'Medium' | 'High') || 'Medium',
              status: (task.status as 'To Do' | 'In Progress' | 'Completed') || 'To Do',
              createdAt: task.created_at ? new Date(task.created_at) : new Date(),
              updatedAt: task.updated_at ? new Date(task.updated_at) : new Date(),
              assignedToId,
              assignedToName,
              assignedToIds,
              assignedToNames,
              cost: Number(task.cost) || 0,
              organizationId: task.organization_id
            };
          });

        if (process.env.NODE_ENV === 'development') {
          console.log('useTasksPageData: Successfully processed MY TASKS:', {
            originalCount: tasksData.length,
            processedCount: processedTasks.length,
            userId: user.id,
            role: user.role
          });
        }

        return flatTasksToTasks(processedTasks);
      });
    },
    enabled: !!user?.organizationId && !!user?.id,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: (failureCount, error: any) => {
      // More aggressive retry for network issues
      if (failureCount >= 3) return false;
      
      // Don't retry on auth/permission errors
      if (error.message.includes('organization') || error.message.includes('permission')) return false;
      if (error.message.includes('invalid input syntax for type uuid')) return false;
      if (error.message.includes('set-returning functions are not allowed in WHERE')) return false;
      
      // Retry on network errors
      if (error.message.includes('Network connection issue') || 
          error.message.includes('timeout') ||
          error.message.includes('Failed to fetch')) {
        return true;
      }
      
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  // Memoize the return value to prevent unnecessary re-renders
  const memoizedResult = useMemo(() => ({
    tasks,
    isLoading,
    error
  }), [tasks, isLoading, error]);

  // Enhanced error logging and user feedback
  if (error && process.env.NODE_ENV === 'development') {
    console.error('useTasksPageData: My tasks query error:', error);
  }

  return memoizedResult;
};
