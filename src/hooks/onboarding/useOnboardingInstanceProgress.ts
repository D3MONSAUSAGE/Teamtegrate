import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingInstanceProgress {
  instanceId: string;
  totalSteps: number;
  completedSteps: number;
  availableSteps: number;
  completionPercentage: number;
  isStepBased: boolean;
}

export function useOnboardingInstanceProgress(instanceId: string) {
  return useQuery({
    queryKey: ['onboarding-instance-progress', instanceId],
    queryFn: async (): Promise<OnboardingInstanceProgress> => {
      // Check if this is a step-based onboarding
      const { data: stepProgress } = await supabase
        .from('onboarding_instance_step_progress')
        .select('status')
        .eq('instance_id', instanceId);

      if (stepProgress && stepProgress.length > 0) {
        // Step-based system
        const totalSteps = stepProgress.length;
        const completedSteps = stepProgress.filter(step => step.status === 'completed').length;
        const availableSteps = stepProgress.filter(step => 
          step.status === 'available' || step.status === 'in_progress'
        ).length;
        const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

        return {
          instanceId,
          totalSteps,
          completedSteps,
          availableSteps,
          completionPercentage,
          isStepBased: true,
        };
      } else {
        // Legacy task-based system
        const { data: tasks } = await supabase
          .from('onboarding_instance_tasks')
          .select('status')
          .eq('instance_id', instanceId);

        const instanceTasks = tasks || [];
        const totalSteps = instanceTasks.length;
        const completedSteps = instanceTasks.filter((task: any) => task.status === 'completed').length;
        const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

        return {
          instanceId,
          totalSteps,
          completedSteps,
          availableSteps: instanceTasks.filter((task: any) => 
            task.status === 'pending' || task.status === 'in_progress'
          ).length,
          completionPercentage,
          isStepBased: false,
        };
      }
    },
    enabled: !!instanceId,
  });
}