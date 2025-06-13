
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

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        throw tasksError;
      }

      console.log(`Fetched ${tasksData?.length || 0} tasks from database`);

      // Convert flat tasks to proper Task objects
      const flatTasks = tasksData?.map(task => ({
        id: task.id,
        userId: task.user_id || '',
        projectId: task.project_id,
        title: task.title || '',
        description: task.description || '',
        deadline: task.deadline ? new Date(task.deadline) : new Date(),
        priority: task.priority as 'Low' | 'Medium' | 'High',
        status: task.status as 'To Do' | 'In Progress' | 'Completed',
        createdAt: task.created_at ? new Date(task.created_at) : new Date(),
        updatedAt: task.updated_at ? new Date(task.updated_at) : new Date(),
        assignedToId: task.assigned_to_id,
        assignedToIds: task.assigned_to_ids || [],
        assignedToNames: task.assigned_to_names || [],
        cost: Number(task.cost) || 0,
        organizationId: task.organization_id
      })) || [];

      return flatTasksToTasks(flatTasks);
    },
    enabled: !!user?.organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (error) {
    console.error('Tasks query error:', error);
    toast.error('Failed to load tasks');
  }

  return {
    tasks,
    isLoading,
    error
  };
};
