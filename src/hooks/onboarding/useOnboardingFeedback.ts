import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingFeedbackCheckpoint, OnboardingFeedbackStatus } from '@/types/onboarding';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth/AuthProvider';

// Hook for fetching feedback checkpoints for an instance
export const useInstanceFeedbackCheckpoints = (instanceId: string) => {
  return useQuery({
    queryKey: ['onboarding-feedback', instanceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_feedback_checkpoints')
        .select('*')
        .eq('instance_id', instanceId)
        .order('days_offset', { ascending: true });

      if (error) throw error;
      return data as OnboardingFeedbackCheckpoint[];
    },
    enabled: !!instanceId,
  });
};

// Hook for fetching pending feedback checkpoints for current user
export const useMyPendingFeedback = () => {
  return useQuery({
    queryKey: ['my-pending-feedback'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get feedback checkpoints
      const { data: checkpoints, error: checkpointsError } = await supabase
        .from('onboarding_feedback_checkpoints')
        .select('*')
        .eq('employee_id', user.user.id)
        .eq('status', 'pending')
        .order('days_offset', { ascending: true });

      if (checkpointsError) throw checkpointsError;

      // Get instance details for each checkpoint
      const checkpointsWithInstances = await Promise.all(
        (checkpoints || []).map(async (checkpoint) => {
          const { data: instance, error: instanceError } = await supabase
            .from('onboarding_instances')
            .select(`
              id,
              start_date,
              onboarding_templates(id, name)
            `)
            .eq('id', checkpoint.instance_id)
            .single();

          if (instanceError) throw instanceError;

          return {
            ...checkpoint,
            instance: {
              id: instance.id,
              start_date: instance.start_date,
              template: instance.onboarding_templates
            }
          };
        })
      );

      return checkpointsWithInstances;
    },
  });
};

// Hook for fetching all feedback checkpoints for organization (managers)
export const useOrganizationFeedback = () => {
  return useQuery({
    queryKey: ['organization-feedback'],
    queryFn: async () => {
      // Get all feedback checkpoints
      const { data: checkpoints, error: checkpointsError } = await supabase
        .from('onboarding_feedback_checkpoints')
        .select('*')
        .order('created_at', { ascending: false });

      if (checkpointsError) throw checkpointsError;

      // Get instance and employee details for each checkpoint
      const checkpointsWithDetails = await Promise.all(
        (checkpoints || []).map(async (checkpoint) => {
          const { data: instance, error: instanceError } = await supabase
            .from('onboarding_instances')
            .select(`
              id,
              start_date,
              employee_id,
              onboarding_templates(id, name)
            `)
            .eq('id', checkpoint.instance_id)
            .single();

          if (instanceError) {
            return {
              ...checkpoint,
              instance: null
            };
          }

          // Get employee details
          const { data: employee } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', instance.employee_id)
            .single();

          return {
            ...checkpoint,
            instance: {
              id: instance.id,
              start_date: instance.start_date,
              employee,
              template: instance.onboarding_templates
            }
          };
        })
      );

      return checkpointsWithDetails;
    },
  });
};

// Hook for creating feedback checkpoints
export const useFeedbackCheckpointManagement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createCheckpoint = useMutation({
    mutationFn: async (checkpoint: {
      instance_id: string;
      employee_id: string;
      days_offset: number;
      checkpoint_label?: string;
    }) => {
      if (!user?.organizationId) throw new Error('No organization');

      const { data, error } = await supabase
        .from('onboarding_feedback_checkpoints')
        .insert([{
          ...checkpoint,
          organization_id: user.organizationId
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['organization-feedback'] });
      toast({
        title: "Success",
        description: "Feedback checkpoint created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create feedback checkpoint.",
        variant: "destructive",
      });
      console.error('Error creating feedback checkpoint:', error);
    },
  });

  const updateCheckpoint = useMutation({
    mutationFn: async ({
      checkpointId,
      rating,
      notes,
      status,
    }: {
      checkpointId: string;
      rating?: number;
      notes?: string;
      status?: OnboardingFeedbackStatus;
    }) => {
      const updates: Partial<OnboardingFeedbackCheckpoint> = {};
      
      if (rating !== undefined) updates.rating = rating;
      if (notes !== undefined) updates.notes = notes;
      if (status !== undefined) {
        updates.status = status;
        if (status === 'completed') {
          updates.completed_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('onboarding_feedback_checkpoints')
        .update(updates)
        .eq('id', checkpointId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['organization-feedback'] });
      toast({
        title: "Success",
        description: "Feedback submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit feedback.",
        variant: "destructive",
      });
      console.error('Error updating feedback checkpoint:', error);
    },
  });

  const deleteCheckpoint = useMutation({
    mutationFn: async (checkpointId: string) => {
      const { error } = await supabase
        .from('onboarding_feedback_checkpoints')
        .delete()
        .eq('id', checkpointId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['organization-feedback'] });
      toast({
        title: "Success",
        description: "Feedback checkpoint deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete feedback checkpoint.",
        variant: "destructive",
      });
      console.error('Error deleting feedback checkpoint:', error);
    },
  });

  return {
    createCheckpoint,
    updateCheckpoint,
    deleteCheckpoint,
    isCreating: createCheckpoint.isPending,
    isUpdating: updateCheckpoint.isPending,
    isDeleting: deleteCheckpoint.isPending,
  };
};