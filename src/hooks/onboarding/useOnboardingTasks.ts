import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { OnboardingTask, OnboardingInstanceTask, OnboardingTaskFormData } from '@/types/onboarding';
import { toast } from 'sonner';

export const useOnboardingInstanceTasks = (instanceId: string) => {
  const { user } = useAuth();

  const tasksQuery = useQuery({
    queryKey: ['onboarding-instance-tasks', instanceId],
    queryFn: async () => {
      if (!instanceId) throw new Error('No instance ID');

      const { data, error } = await supabase
        .from('onboarding_instance_tasks')
        .select('*')
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as OnboardingInstanceTask[];
    },
    enabled: !!instanceId,
  });

  const queryClient = useQueryClient();

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: OnboardingInstanceTask['status'] }) => {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'in_progress' && !tasks?.find(t => t.id === taskId)?.started_at) {
        updates.started_at = new Date().toISOString();
      }

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('onboarding_instance_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-instance-tasks', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['my-onboarding'] });
      toast.success('Task status updated');
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
    },
  });

  const addTaskNote = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes: string }) => {
      const { data, error } = await supabase
        .from('onboarding_instance_tasks')
        .update({
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-instance-tasks', instanceId] });
      toast.success('Note added successfully');
    },
    onError: (error) => {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    },
  });

  const tasks = tasksQuery.data ?? [];

  return {
    tasks,
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    updateTaskStatus,
    addTaskNote,
    isUpdating: updateTaskStatus.isPending || addTaskNote.isPending,
  };
};

export const useTemplateTaskManagement = (templateId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const templateTasksQuery = useQuery({
    queryKey: ['template-tasks', templateId],
    queryFn: async () => {
      if (!templateId) throw new Error('No template ID');

      const { data, error } = await supabase
        .from('onboarding_tasks')
        .select(`
          *,
          onboarding_stages (
            id,
            title
          )
        `)
        .eq('template_id', templateId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as OnboardingTask[];
    },
    enabled: !!templateId,
  });

  const createTask = useMutation({
    mutationFn: async (taskData: OnboardingTaskFormData) => {
      if (!user?.organizationId) throw new Error('No organization');

      const { data, error } = await supabase
        .from('onboarding_tasks')
        .insert({
          ...taskData,
          template_id: templateId,
          organization_id: user.organizationId,
          resource_links: taskData.resource_links || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-tasks', templateId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-template', templateId] });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<OnboardingTaskFormData>) => {
      const { data, error } = await supabase
        .from('onboarding_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-tasks', templateId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-template', templateId] });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('onboarding_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-tasks', templateId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-template', templateId] });
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    },
  });

  return {
    tasks: templateTasksQuery.data ?? [],
    isLoading: templateTasksQuery.isLoading,
    error: templateTasksQuery.error,
    createTask,
    updateTask,
    deleteTask,
    isCreating: createTask.isPending,
    isUpdating: updateTask.isPending,
    isDeleting: deleteTask.isPending,
  };
};