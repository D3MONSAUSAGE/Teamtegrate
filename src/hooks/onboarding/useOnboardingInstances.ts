import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { OnboardingInstance, CreateOnboardingInstanceRequest, OnboardingProgress } from '@/types/onboarding';
import { toast } from 'sonner';

export const useOnboardingInstances = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const instancesQuery = useQuery({
    queryKey: ['onboarding-instances', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) throw new Error('No organization');

      const { data, error } = await supabase
        .from('onboarding_instances')
        .select(`
          *,
          onboarding_templates (
            name,
            description
          ),
          users!onboarding_instances_employee_id_fkey (
            id,
            name,
            email,
            role
          )
        `)
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OnboardingInstance[];
    },
    enabled: !!user?.organizationId,
  });

  const createInstance = useMutation({
    mutationFn: async (instanceData: CreateOnboardingInstanceRequest) => {
      if (!user?.organizationId || !user?.id) throw new Error('No user or organization');

      // Create the instance
      const { data: instance, error: instanceError } = await supabase
        .from('onboarding_instances')
        .insert({
          ...instanceData,
          organization_id: user.organizationId,
          created_by: user.id,
          start_date: instanceData.start_date || new Date().toISOString(),
        })
        .select()
        .single();

      if (instanceError) throw instanceError;

      // If template provided, create rich journey structure with steps
      if (instanceData.template_id) {
        // First check if template has rich journey structure (steps)
        const { data: templateSteps, error: stepsError } = await supabase
          .from('onboarding_steps')
          .select('*')
          .eq('template_id', instanceData.template_id)
          .order('order_index');

        if (stepsError) throw stepsError;

        if (templateSteps && templateSteps.length > 0) {
          // Create rich journey structure
          const stepProgressRecords = templateSteps.map(step => {
            // Steps with no prerequisites are available initially, others are locked
            const hasPrerequisites = step.prerequisites && Array.isArray(step.prerequisites) && step.prerequisites.length > 0;
            const status = hasPrerequisites ? 'locked' : 'available';

            return {
              instance_id: instance.id,
              step_id: step.id,
              employee_id: instanceData.employee_id,
              organization_id: user.organizationId,
              status,
            };
          });

          const { error: insertError } = await supabase
            .from('onboarding_instance_step_progress')
            .insert(stepProgressRecords);

          if (insertError) throw insertError;
        } else {
          // Fallback to legacy task system if no steps found
          const { data: templateTasks, error: tasksError } = await supabase
            .from('onboarding_tasks')
            .select('*')
            .eq('template_id', instanceData.template_id);

          if (tasksError) throw tasksError;

          if (templateTasks && templateTasks.length > 0) {
            const instanceTasks = templateTasks.map(task => {
              const dueDate = task.due_offset_days 
                ? new Date(Date.now() + task.due_offset_days * 24 * 60 * 60 * 1000).toISOString()
                : null;

              return {
                instance_id: instance.id,
                template_task_id: task.id,
                organization_id: user.organizationId,
                employee_id: instanceData.employee_id,
                title: task.title,
                description: task.description,
                category: task.category,
                owner_type: task.owner_type,
                due_date: dueDate,
                resource_links: task.resource_links,
                status: 'pending' as const,
              };
            });

            const { error: insertError } = await supabase
              .from('onboarding_instance_tasks')
              .insert(instanceTasks);

            if (insertError) throw insertError;
          }
        }
      }

      return instance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-instances'] });
      toast.success('Onboarding instance created successfully');
    },
    onError: (error) => {
      console.error('Error creating onboarding instance:', error);
      toast.error('Failed to create onboarding instance');
    },
  });

  const updateInstance = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<OnboardingInstance>) => {
      const { data, error } = await supabase
        .from('onboarding_instances')
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
      queryClient.invalidateQueries({ queryKey: ['onboarding-instances'] });
      toast.success('Onboarding instance updated successfully');
    },
    onError: (error) => {
      console.error('Error updating onboarding instance:', error);
      toast.error('Failed to update onboarding instance');
    },
  });

  return {
    instances: instancesQuery.data ?? [],
    isLoading: instancesQuery.isLoading,
    error: instancesQuery.error,
    createInstance,
    updateInstance,
    isCreating: createInstance.isPending,
    isUpdating: updateInstance.isPending,
  };
};

export const useMyOnboarding = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('onboarding_instances')
        .select(`
          *,
          onboarding_templates (
            name,
            description
          ),
          onboarding_instance_tasks (*),
          onboarding_feedback_checkpoints (*)
        `)
        .eq('employee_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as OnboardingInstance | null;
    },
    enabled: !!user?.id,
  });
};

export const useOnboardingProgress = (instanceId: string) => {
  return useQuery({
    queryKey: ['onboarding-progress', instanceId],
    queryFn: async () => {
      const { data: instance, error: instanceError } = await supabase
        .from('onboarding_instances')
        .select(`
          *,
          onboarding_templates (*)
        `)
        .eq('id', instanceId)
        .single();

      if (instanceError) throw instanceError;

      // Check if this is a step-based onboarding (modern system)
      const { data: stepProgress } = await supabase
        .from('onboarding_instance_step_progress')
        .select('status')
        .eq('instance_id', instanceId);

      if (stepProgress && stepProgress.length > 0) {
        // Step-based system
        const totalSteps = stepProgress.length;
        const completedSteps = stepProgress.filter(step => step.status === 'completed').length;
        const availableSteps = stepProgress.filter(step => step.status === 'available' || step.status === 'in_progress').length;
        
        return {
          instance,
          completedTasks: completedSteps,
          totalTasks: totalSteps,
          completionRate: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
          upcomingTasks: [], // Steps don't have due dates in the same way
          overdueTasks: [],
          isStepBased: true,
        } as OnboardingProgress & { isStepBased: boolean };
      } else {
        // Legacy task-based system
        const { data: tasks } = await supabase
          .from('onboarding_instance_tasks')
          .select('*')
          .eq('instance_id', instanceId);

        const instanceTasks = tasks || [];
        const completedTasks = instanceTasks.filter((task: any) => task.status === 'completed').length;
        const totalTasks = instanceTasks.length;
        
        const now = new Date();
        const upcomingTasks = instanceTasks.filter((task: any) => 
          task.status === 'pending' && 
          task.due_date && 
          new Date(task.due_date) > now
        );
        
        const overdueTasks = instanceTasks.filter((task: any) => 
          task.status !== 'completed' && 
          task.due_date && 
          new Date(task.due_date) < now
        );

        return {
          instance,
          completedTasks,
          totalTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          upcomingTasks,
          overdueTasks,
          isStepBased: false,
        } as OnboardingProgress & { isStepBased: boolean };
      }
    },
    enabled: !!instanceId,
  });
};