import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Focused mutations for training_assignments table
export const useDeleteTrainingAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { prevAssignments?: any[] }>({
    mutationKey: ['delete-training-assignment'],
    mutationFn: async (assignmentId: string) => {
      console.debug('[Training] Deleting assignment', assignmentId);
      const { error } = await supabase
        .from('training_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onMutate: async (assignmentId: string) => {
      console.debug('[Training] onMutate start', assignmentId);
      // Only cancel training-assignments query to avoid expensive employee-progress refetch
      await queryClient.cancelQueries({ queryKey: ['training-assignments'] });

      const prevAssignments = queryClient.getQueryData<any[]>(['training-assignments']);
      if (Array.isArray(prevAssignments)) {
        queryClient.setQueryData(
          ['training-assignments'],
          prevAssignments.filter((a) => a?.id !== assignmentId)
        );
      }

      return { prevAssignments };
    },
    onError: (error, _assignmentId, context) => {
      console.error('Error deleting training assignment:', error);
      if (context?.prevAssignments) {
        queryClient.setQueryData(['training-assignments'], context.prevAssignments);
      }
      toast.error('Failed to remove training assignment');
    },
    onSuccess: () => {
      toast.success('Training assignment removed');
    },
    onSettled: () => {
      // Only invalidate lightweight queries to prevent performance issues
      queryClient.invalidateQueries({ queryKey: ['training-assignments'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['training-stats'], refetchType: 'active' });
      console.debug('[Training] Assignment deletion settled');
    },
    retry: 1,
  });
};
