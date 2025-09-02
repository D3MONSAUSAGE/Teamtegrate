import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { OnboardingJourney, OnboardingInstanceStepProgress } from '@/types/onboardingSteps';

export function useOnboardingJourney(instanceId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch onboarding journey for an instance
  const { data: journey, isLoading, error } = useQuery({
    queryKey: ['onboarding-journey', instanceId],
    queryFn: async (): Promise<OnboardingJourney | null> => {
      if (!instanceId || !user) return null;

      // Get the instance with template info
      const { data: instance, error: instanceError } = await supabase
        .from('onboarding_instances')
        .select(`
          id,
          employee_id,
          template:onboarding_templates(id, name, description)
        `)
        .eq('id', instanceId)
        .single();

      if (instanceError) throw instanceError;

      // Get all steps for this template with progress
      const { data: stepProgress, error: progressError } = await supabase
        .from('onboarding_instance_step_progress')
        .select(`
          *,
          step:onboarding_steps(
            *,
            stage:onboarding_stages(id, title, description, order_index)
          )
        `)
        .eq('instance_id', instanceId)
        .order('step.order_index');

      if (progressError) throw progressError;

      // Group steps by stage
      const stageMap = new Map();
      const allSteps: OnboardingInstanceStepProgress[] = [];

      stepProgress.forEach((progress: any) => {
        const stageId = progress.step?.stage?.id || 'no-stage';
        const stage = progress.step?.stage || { 
          id: 'no-stage', 
          title: 'General', 
          order_index: 0 
        };

        if (!stageMap.has(stageId)) {
          stageMap.set(stageId, {
            ...stage,
            steps: []
          });
        }

        const stepWithProgress = {
          ...progress,
          step: progress.step
        };
        
        stageMap.get(stageId).steps.push(stepWithProgress);
        allSteps.push(stepWithProgress);
      });

      // Convert map to array and sort by stage order
      const stages = Array.from(stageMap.values()).sort(
        (a, b) => a.order_index - b.order_index
      );

      // Calculate progress statistics
      const totalSteps = allSteps.length;
      const completedSteps = allSteps.filter(s => s.status === 'completed').length;
      const availableSteps = allSteps.filter(s => s.status === 'available').length;
      const completionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

      // Find current step (first available or in_progress step)
      const currentStep = allSteps.find(s => 
        s.status === 'in_progress' || s.status === 'available'
      );

      return {
        instance,
        stages,
        currentStep,
        progress: {
          totalSteps,
          completedSteps,
          availableSteps,
          completionPercentage,
        },
      };
    },
    enabled: !!instanceId && !!user,
  });

  // Start step mutation
  const startStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const { data, error } = await supabase
        .from('onboarding_instance_step_progress')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('step_id', stepId)
        .eq('instance_id', instanceId!)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-journey', instanceId] });
      toast.success('Step started successfully');
    },
    onError: (error) => {
      console.error('Error starting step:', error);
      toast.error('Failed to start step');
    },
  });

  // Complete step mutation
  const completeStepMutation = useMutation({
    mutationFn: async ({ 
      stepId, 
      completionData, 
      notes 
    }: { 
      stepId: string; 
      completionData?: Record<string, any>; 
      notes?: string;
    }) => {
      // Mark current step as completed
      const { data, error } = await supabase
        .from('onboarding_instance_step_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_data: completionData,
          notes,
        })
        .eq('step_id', stepId)
        .eq('instance_id', instanceId!)
        .select()
        .single();

      if (error) throw error;

      // Find and unlock next available steps
      const { data: currentStep } = await supabase
        .from('onboarding_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (currentStep) {
        // Find steps that had this as a prerequisite
        const { data: dependentSteps } = await supabase
          .from('onboarding_steps')
          .select('id')
          .eq('template_id', currentStep.template_id)
          .contains('prerequisites', [stepId]);

        if (dependentSteps?.length > 0) {
          // Check if all prerequisites are met for each dependent step
          for (const depStep of dependentSteps) {
            const { data: stepInfo } = await supabase
              .from('onboarding_steps')
              .select('prerequisites')
              .eq('id', depStep.id)
              .single();

            if (stepInfo?.prerequisites) {
              // Check if all prerequisites are completed
              const prereqArray = Array.isArray(stepInfo.prerequisites) 
                ? stepInfo.prerequisites.filter(id => typeof id === 'string') as string[]
                : [];
              
              if (prereqArray.length > 0) {
                const { data: prereqProgress } = await supabase
                  .from('onboarding_instance_step_progress')
                  .select('status')
                  .eq('instance_id', instanceId!)
                  .in('step_id', prereqArray);

                const allCompleted = prereqProgress?.every(p => p.status === 'completed');
                
                if (allCompleted) {
                  // Unlock this step
                  await supabase
                    .from('onboarding_instance_step_progress')
                    .update({ status: 'available' })
                    .eq('step_id', depStep.id)
                    .eq('instance_id', instanceId!);
                }
              } else {
                // No prerequisites, unlock immediately
                await supabase
                  .from('onboarding_instance_step_progress')
                  .update({ status: 'available' })
                  .eq('step_id', depStep.id)
                  .eq('instance_id', instanceId!);
              }
            }
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-journey', instanceId] });
      toast.success('Step completed successfully');
    },
    onError: (error) => {
      console.error('Error completing step:', error);
      toast.error('Failed to complete step');
    },
  });

  return {
    journey,
    isLoading,
    error,
    startStep: startStepMutation.mutate,
    completeStep: completeStepMutation.mutate,
    isStarting: startStepMutation.isPending,
    isCompleting: completeStepMutation.isPending,
  };
}