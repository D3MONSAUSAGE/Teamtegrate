import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { OnboardingStep, OnboardingStepFormData, OnboardingStepContent, OnboardingStepRequirement } from '@/types/onboardingSteps';

export function useOnboardingSteps(templateId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch onboarding steps for a template
  const { data: steps, isLoading, error } = useQuery({
    queryKey: ['onboarding-steps', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('onboarding_steps')
        .select(`
          *,
          content:onboarding_step_content(*),
          requirements:onboarding_step_requirements(*)
        `)
        .eq('template_id', templateId)
        .order('order_index');

      if (error) throw error;
      return (data || []).map(step => ({
        ...step,
        prerequisites: Array.isArray(step.prerequisites) ? step.prerequisites : [],
        content: step.content || [],
        requirements: step.requirements || []
      })) as (OnboardingStep & { 
        content: OnboardingStepContent[];
        requirements: OnboardingStepRequirement[];
      })[];
    },
    enabled: !!templateId,
  });

  // Create step mutation
  const createStepMutation = useMutation({
    mutationFn: async ({ templateId, stageId, stepData }: {
      templateId: string;
      stageId?: string;
      stepData: OnboardingStepFormData;
    }) => {
      // Get the next order index
      const { data: existingSteps } = await supabase
        .from('onboarding_steps')
        .select('order_index')
        .eq('template_id', templateId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingSteps?.[0]?.order_index + 1 || 0;

      // Create the step
      const { data: step, error: stepError } = await supabase
        .from('onboarding_steps')
        .insert({
          template_id: templateId,
          stage_id: stageId,
          organization_id: user?.organizationId || '',
          title: stepData.title,
          description: stepData.description,
          step_type: stepData.step_type,
          order_index: nextOrderIndex,
          is_required: stepData.is_required,
          estimated_duration_minutes: stepData.estimated_duration_minutes,
          due_offset_days: stepData.due_offset_days,
          prerequisites: stepData.prerequisites as any,
        })
        .select()
        .single();

      if (stepError) throw stepError;

      // Create step content
      if (stepData.content?.length > 0) {
        const contentData = stepData.content.map((content, index) => ({
          step_id: step.id,
          organization_id: user?.organizationId || '',
          content_type: content.content_type,
          content_data: content.content_data as any,
          order_index: index,
        }));

        const { error: contentError } = await supabase
          .from('onboarding_step_content')
          .insert(contentData);

        if (contentError) throw contentError;
      }

      // Create step requirements
      if (stepData.requirements?.length > 0) {
        const requirementData = stepData.requirements.map((req) => ({
          step_id: step.id,
          organization_id: user?.organizationId || '',
          requirement_type: req.requirement_type,
          requirement_id: req.requirement_id,
          requirement_data: req.requirement_data as any,
          is_required: req.is_required,
        }));

        const { error: reqError } = await supabase
          .from('onboarding_step_requirements')
          .insert(requirementData);

        if (reqError) throw reqError;
      }

      return step;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps', templateId] });
      toast.success('Onboarding step created successfully');
    },
    onError: (error) => {
      console.error('Error creating onboarding step:', error);
      toast.error('Failed to create onboarding step');
    },
  });

  // Update step mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, stepData }: {
      stepId: string;
      stepData: Partial<OnboardingStepFormData>;
    }) => {
      const { data, error } = await supabase
        .from('onboarding_steps')
        .update({
          title: stepData.title,
          description: stepData.description,
          step_type: stepData.step_type,
          is_required: stepData.is_required,
          estimated_duration_minutes: stepData.estimated_duration_minutes,
          due_offset_days: stepData.due_offset_days,
          prerequisites: stepData.prerequisites as any,
        })
        .eq('id', stepId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps', templateId] });
      toast.success('Onboarding step updated successfully');
    },
    onError: (error) => {
      console.error('Error updating onboarding step:', error);
      toast.error('Failed to update onboarding step');
    },
  });

  // Delete step mutation
  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      // Delete step content first
      await supabase
        .from('onboarding_step_content')
        .delete()
        .eq('step_id', stepId);

      // Delete step requirements
      await supabase
        .from('onboarding_step_requirements')
        .delete()
        .eq('step_id', stepId);

      // Delete the step
      const { error } = await supabase
        .from('onboarding_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps', templateId] });
      toast.success('Onboarding step deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting onboarding step:', error);
      toast.error('Failed to delete onboarding step');
    },
  });

  // Reorder steps mutation
  const reorderStepsMutation = useMutation({
    mutationFn: async (steps: Array<{ id: string; order_index: number }>) => {
      const updates = steps.map(step => 
        supabase
          .from('onboarding_steps')
          .update({ order_index: step.order_index })
          .eq('id', step.id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps', templateId] });
      toast.success('Steps reordered successfully');
    },
    onError: (error) => {
      console.error('Error reordering steps:', error);
      toast.error('Failed to reorder steps');
    },
  });

  return {
    steps: steps || [],
    isLoading,
    error,
    createStep: createStepMutation.mutate,
    updateStep: updateStepMutation.mutate,
    deleteStep: deleteStepMutation.mutate,
    reorderSteps: reorderStepsMutation.mutate,
    isCreating: createStepMutation.isPending,
    isUpdating: updateStepMutation.isPending,
    isDeleting: deleteStepMutation.isPending,
    isReordering: reorderStepsMutation.isPending,
  };
}