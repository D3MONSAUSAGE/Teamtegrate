
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import { useMemo } from 'react';
import { requestManager } from '@/utils/requestManager';
import { useTaskRealtime } from './useTaskRealtime';

export const usePersonalTasks = () => {
  const { user } = useAuth();

  // Add real-time subscription
  useTaskRealtime();

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

        try {
          // Strategy: Use multiple simpler queries and combine results client-side
          // This avoids the complex malformed .or() query that was causing issues
          
          // Query 1: Tasks created by user (for potential personal tasks)
          const createdTasksPromise = supabase
            .from('tasks')
            .select('*')
            .eq('organization_id', user.organizationId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          // Query 2: Tasks assigned to user (single assignment)
          const singleAssignedPromise = supabase
            .from('tasks')
            .select('*')
            .eq('organization_id', user.organizationId)
            .eq('assigned_to_id', user.id)
            .order('created_at', { ascending: false });

          // Query 3: Tasks where user is in the assigned_to_ids array
          const multiAssignedPromise = supabase
            .from('tasks')
            .select('*')
            .eq('organization_id', user.organizationId)
            .contains('assigned_to_ids', [user.id])
            .order('created_at', { ascending: false });

          // Execute all queries in parallel with timeout
          const [createdResult, singleAssignedResult, multiAssignedResult] = await Promise.race([
            Promise.all([createdTasksPromise, singleAssignedPromise, multiAssignedPromise]),
            timeoutPromise
          ]) as any;

          // Check for errors in any of the queries
          if (createdResult.error) {
            console.error('usePersonalTasks: Error fetching created tasks:', createdResult.error);
            throw new Error(`Failed to fetch created tasks: ${createdResult.error.message}`);
          }
          if (singleAssignedResult.error) {
            console.error('usePersonalTasks: Error fetching single assigned tasks:', singleAssignedResult.error);
            throw new Error(`Failed to fetch assigned tasks: ${singleAssignedResult.error.message}`);
          }
          if (multiAssignedResult.error) {
            console.error('usePersonalTasks: Error fetching multi assigned tasks:', multiAssignedResult.error);
            throw new Error(`Failed to fetch multi-assigned tasks: ${multiAssignedResult.error.message}`);
          }

          // Combine all tasks and remove duplicates using a Map keyed by task ID
          const allTasksMap = new Map();
          
          // Add created tasks
          (createdResult.data || []).forEach(task => {
            allTasksMap.set(task.id, task);
          });
          
          // Add single assigned tasks
          (singleAssignedResult.data || []).forEach(task => {
            allTasksMap.set(task.id, task);
          });
          
          // Add multi assigned tasks
          (multiAssignedResult.data || []).forEach(task => {
            allTasksMap.set(task.id, task);
          });

          const combinedTasks = Array.from(allTasksMap.values());

          if (process.env.NODE_ENV === 'development') {
            console.log(`usePersonalTasks: Combined ${combinedTasks.length} tasks from all queries`);
            console.log('Query results:', {
              created: createdResult.data?.length || 0,
              singleAssigned: singleAssignedResult.data?.length || 0,
              multiAssigned: multiAssignedResult.data?.length || 0,
              combined: combinedTasks.length
            });
          }

          if (combinedTasks.length === 0) {
            return [];
          }

          // Client-side filtering to ensure strict personal task access
          const filteredTasks = combinedTasks.filter(task => {
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

          if (process.env.NODE_ENV === 'development') {
            console.log('usePersonalTasks: Successfully processed PERSONAL TASKS ONLY:', {
              processedCount: transformedTasks.length,
              userId: user.id,
              role: user.role
            });
          }

          return transformedTasks;

        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('usePersonalTasks: Error in query execution:', error);
          }
          
          // Handle specific error types
          if (error.message?.includes('invalid input syntax for type uuid')) {
            throw new Error('Data validation error. Please refresh the page and try again.');
          }
          
          if (error.message?.includes('set-returning functions are not allowed in WHERE')) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('usePersonalTasks: RLS function transition in progress, returning empty tasks array');
            }
            return [];
          }

          // Network-related errors
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('Network Error') ||
              error.message?.includes('timeout')) {
            throw new Error('Network connection issue. Please check your connection and try again.');
          }
          
          throw new Error(`Failed to fetch personal tasks: ${error.message}`);
        }
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
