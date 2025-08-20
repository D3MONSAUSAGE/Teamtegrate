
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import { useMemo } from 'react';

export const useProjectTasks = (projectId: string | null) => {
  const { user } = useAuth();

  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['project-tasks', projectId, user?.organizationId],
    queryFn: async (): Promise<Task[]> => {
      if (!projectId || !user?.organizationId || !user?.id) {
        console.log('❌ useProjectTasks: Missing required data', { projectId, orgId: user?.organizationId, userId: user?.id });
        return [];
      }

      console.log('🔍 useProjectTasks: Fetching ALL tasks for project:', projectId);

      // Fetch ALL tasks for this specific project (not just assigned to current user)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', user.organizationId)
        .or('is_archived.is.null,is_archived.eq.false')
        .order('deadline', { ascending: true }); // Order by deadline (earliest first) to match frontend default

      if (tasksError) {
        console.error('❌ useProjectTasks: Error fetching project tasks:', tasksError);
        throw new Error(`Failed to fetch project tasks: ${tasksError.message}`);
      }

      console.log(`📊 useProjectTasks: Retrieved ${tasksData?.length || 0} tasks for project`);

      if (!tasksData || tasksData.length === 0) {
        console.log('📭 useProjectTasks: No tasks found for project');
        return [];
      }

      // Fetch users data for name lookup
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('organization_id', user.organizationId);

      if (usersError) {
        console.error('⚠️ useProjectTasks: Error fetching users:', usersError);
      }

      // Create user lookup map
      const userLookup = new Map();
      if (usersData) {
        usersData.forEach(userData => {
          userLookup.set(userData.id, userData.name || userData.email);
        });
      }

      // Transform tasks to app format
      const transformedTasks = tasksData.map(task => {
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

        const transformedTask = {
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

        console.log('📋 Transformed task:', { id: transformedTask.id, title: transformedTask.title, status: transformedTask.status });
        return transformedTask;
      });

      console.log('✅ useProjectTasks: Successfully processed project tasks:', transformedTasks.length);
      return transformedTasks;
    },
    enabled: !!projectId && !!user?.organizationId && !!user?.id,
    staleTime: 1000, // Reduced stale time for quicker updates
    gcTime: 30000, // Reduced cache time
    retry: (failureCount, error: any) => {
      if (failureCount >= 3) return false;
      if (error.message.includes('organization') || error.message.includes('permission')) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  const memoizedResult = useMemo(() => {
    console.log('🎯 useProjectTasks: Memoized result updated', { 
      tasksCount: tasks.length, 
      isLoading, 
      hasError: !!error 
    });
    return {
      tasks,
      isLoading,
      error,
      refetch
    };
  }, [tasks, isLoading, error, refetch]);

  return memoizedResult;
};
