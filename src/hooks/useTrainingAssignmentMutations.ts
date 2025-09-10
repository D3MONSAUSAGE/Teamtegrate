import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Type for the RPC response
interface DeleteAssignmentResponse {
  success: boolean;
  error?: string;
  message?: string;
  deleted_count?: number;
}

// Focused mutations for training_assignments table
export const useDeleteTrainingAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { prevAssignments?: any[] }>({
    mutationKey: ['delete-training-assignment'],
    mutationFn: async (assignmentId: string) => {
      console.debug('[Training] Deleting assignment safely', assignmentId);
      
      const { data, error } = await supabase.rpc('delete_training_assignment_safe', {
        assignment_id_param: assignmentId
      });

      if (error) {
        console.error('[Training] RPC error:', error);
        throw error;
      }

      if (!(data as unknown as DeleteAssignmentResponse)?.success) {
        console.error('[Training] Safe delete failed:', (data as unknown as DeleteAssignmentResponse)?.error);
        throw new Error((data as unknown as DeleteAssignmentResponse)?.error || 'Failed to delete assignment');
      }

      console.debug('[Training] Assignment deleted successfully:', data);
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
      // More targeted invalidation - only refetch the specific user's assignments
      queryClient.invalidateQueries({ 
        queryKey: ['training-assignments'], 
        refetchType: 'active',
        exact: false 
      });
      // Skip training-stats invalidation to prevent cascading refetches
      console.debug('[Training] Assignment deletion settled');
    },
    retry: 0, // Don't retry deletion attempts
  });
};
