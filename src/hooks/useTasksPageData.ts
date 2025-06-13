
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import { flatTasksToTasks } from '@/utils/typeConversions';
import { toast } from '@/components/ui/sonner';

export const useTasksPageData = () => {
  const { user } = useAuth();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', user?.organizationId],
    queryFn: async (): Promise<Task[]> => {
      if (!user?.organizationId) {
        throw new Error('User must belong to an organization');
      }

      console.log('Fetching tasks for organization:', user.organizationId);

      // Enhanced query with explicit organization filtering as safety net
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', user.organizationId) // Explicit organization filter
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        console.error('Error details:', {
          message: tasksError.message,
          code: tasksError.code,
          details: tasksError.details,
          hint: tasksError.hint
        });
        throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
      }

      console.log(`Successfully fetched ${tasksData?.length || 0} tasks from database`);

      if (!tasksData || tasksData.length === 0) {
        console.log('No tasks found for organization:', user.organizationId);
        return [];
      }

      // Convert flat tasks to proper Task objects with enhanced error handling
      const flatTasks = tasksData.map(task => {
        try {
          return {
            id: task.id,
            userId: task.user_id || '',
            projectId: task.project_id,
            title: task.title || '',
            description: task.description || '',
            deadline: task.deadline ? new Date(task.deadline) : new Date(),
            priority: (task.priority as 'Low' | 'Medium' | 'High') || 'Medium',
            status: (task.status as 'To Do' | 'In Progress' | 'Completed') || 'To Do',
            createdAt: task.created_at ? new Date(task.created_at) : new Date(),
            updatedAt: task.updated_at ? new Date(task.updated_at) : new Date(),
            assignedToId: task.assigned_to_id,
            assignedToIds: task.assigned_to_ids || [],
            assignedToNames: task.assigned_to_names || [],
            cost: Number(task.cost) || 0,
            organizationId: task.organization_id
          };
        } catch (taskError) {
          console.error('Error processing task:', task.id, taskError);
          // Return a basic task structure to avoid breaking the entire list
          return {
            id: task.id || 'unknown',
            userId: task.user_id || '',
            projectId: task.project_id,
            title: task.title || 'Untitled Task',
            description: task.description || '',
            deadline: new Date(),
            priority: 'Medium' as const,
            status: 'To Do' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
            assignedToId: task.assigned_to_id,
            assignedToIds: [],
            assignedToNames: [],
            cost: 0,
            organizationId: task.organization_id
          };
        }
      });

      console.log('Successfully converted tasks to proper format');
      return flatTasksToTasks(flatTasks);
    },
    enabled: !!user?.organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors, but not for auth/permission errors
      if (failureCount >= 2) return false;
      if (error.message.includes('organization') || error.message.includes('permission')) return false;
      return true;
    },
  });

  if (error) {
    console.error('Tasks query error:', error);
    toast.error(`Failed to load tasks: ${error.message}`);
  }

  return {
    tasks,
    isLoading,
    error
  };
};
