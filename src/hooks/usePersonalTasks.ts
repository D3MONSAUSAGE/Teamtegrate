
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import { useMemo } from 'react';
import { requestManager } from '@/utils/requestManager';

export const usePersonalTasks = () => {
  const { user } = useAuth();

  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['personal-tasks', user?.organizationId, user?.id],
    queryFn: async (): Promise<Task[]> => {
      if (!user?.organizationId || !user?.id) {
        if (process.env.NODE_ENV === 'development') {
          console.log('usePersonalTasks: Missing user data, cannot fetch tasks');
        }
        throw new Error('User must be authenticated and belong to an organization');
      }

      const cacheKey = `personal-tasks-${user.organizationId}-${user.id}`;
      
      return requestManager.dedupe(cacheKey, async () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('usePersonalTasks: Fetching PERSONAL TASKS ONLY for user:', {
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role
          });
        }

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );

        // Fetch tasks with refined personal filtering:
        // 1. Tasks created by user AND unassigned (no assigned_to_id and empty assigned_to_ids)
        // 2. Tasks assigned to user (assigned_to_id = user.id OR user.id in assigned_to_ids)
        const taskPromise = supabase
          .from('tasks')
          .select('*')
          .eq('organization_id', user.organizationId)
          .or(`and(user_id.eq.${user.id},assigned_to_id.is.null,assigned_to_ids.eq.{}),assigned_to_id.eq.${user.id},assigned_to_ids.cs.{${user.id}}`)
          .order('created_at', { ascending: false });

        const { data: tasksData, error: tasksError } = await Promise.race([
          taskPromise,
          timeoutPromise
        ]) as any;

        if (tasksError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('usePersonalTasks: Error fetching personal tasks:', tasksError);
          }
          
          // Handle specific error types
          if (tasksError.message?.includes('invalid input syntax for type uuid')) {
            throw new Error('Data validation error. Please refresh the page and try again.');
          }
          
          if (tasksError.message?.includes('set-returning functions are not allowed in WHERE')) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('usePersonalTasks: RLS function transition in progress, returning empty tasks array');
            }
            return [];
          }

          // Network-related errors
          if (tasksError.message?.includes('Failed to fetch') || 
              tasksError.message?.includes('Network Error') ||
              tasksError.message?.includes('timeout')) {
            throw new Error('Network connection issue. Please check your connection and try again.');
          }
          
          throw new Error(`Failed to fetch personal tasks: ${tasksError.message}`);
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(`usePersonalTasks: Retrieved ${tasksData?.length || 0} personal tasks`);
        }

        if (!tasksData || tasksData.length === 0) {
          return [];
        }

        // Additional client-side filtering to ensure strict personal task access
        const filteredTasks = tasksData.filter(task => {
          const isCreatedByUser = task.user_id === user.id;
          const isUnassigned = (!task.assigned_to_id || task.assigned_to_id === '') && 
                              (!task.assigned_to_ids || task.assigned_to_ids.length === 0);
          const isAssignedToUser = task.assigned_to_id === user.id || 
                                  (task.assigned_to_ids && task.assigned_to_ids.includes(user.id));
          
          // Show task if: (created by user AND unassigned) OR (assigned to user)
          return (isCreatedByUser && isUnassigned) || isAssignedToUser;
        });

        // Fetch users data for name lookup with timeout
        const usersPromise = supabase
          .from('users')
          .select('id, name, email')
          .eq('organization_id', user.organizationId);

        const { data: usersData, error: usersError } = await Promise.race([
          usersPromise,
          timeoutPromise
        ]) as any;

        if (usersError && process.env.NODE_ENV === 'development') {
          console.error('usePersonalTasks: Error fetching organization users:', usersError);
        }

        // Create optimized user lookup map
        const userLookup = new Map();
        if (usersData) {
          usersData.forEach(userData => {
            userLookup.set(userData.id, userData.name || userData.email);
          });
        }

        // Transform tasks to app format
        const transformedTasks: Task[] = filteredTasks.map(task => {
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

        if (process.env.NODE_ENV === 'development') {
          console.log('usePersonalTasks: Successfully processed PERSONAL TASKS ONLY:', {
            processedCount: transformedTasks.length,
            userId: user.id,
            role: user.role
          });
        }

        return transformedTasks;
      });
    },
    enabled: !!user?.organizationId && !!user?.id,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: (failureCount, error: any) => {
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
    error,
    refetch
  }), [tasks, isLoading, error, refetch]);

  // Enhanced error logging
  if (error && process.env.NODE_ENV === 'development') {
    console.error('usePersonalTasks: Personal tasks query error:', error);
  }

  return memoizedResult;
};
