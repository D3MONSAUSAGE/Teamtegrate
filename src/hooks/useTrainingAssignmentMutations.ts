import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface OptimisticContext {
  prevAssignments?: any[];
  assignmentId: string;
}

// Bulletproof training assignment deletion with direct client operations
export const useDeleteTrainingAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, OptimisticContext>({
    mutationKey: ['delete-training-assignment'],
    mutationFn: async (assignmentId: string) => {
      console.debug('[Training] Starting bulletproof deletion for:', assignmentId);
      
      try {
        // Step 1: Clear dependencies - Update assignments referencing this one
        console.debug('[Training] Clearing reassigned_from references');
        const { error: reassignError } = await supabase
          .from('training_assignments')
          .update({ reassigned_from: null })
          .eq('reassigned_from', assignmentId);
          
        if (reassignError) {
          console.error('[Training] Failed to clear reassigned_from:', reassignError);
          throw reassignError;
        }

        // Step 2: Clear original assignment references for retraining
        console.debug('[Training] Clearing original_assignment_id references');
        const { error: originalError } = await supabase
          .from('training_assignments')
          .update({ original_assignment_id: null })
          .eq('original_assignment_id', assignmentId);
          
        if (originalError) {
          console.error('[Training] Failed to clear original_assignment_id:', originalError);
          throw originalError;
        }

        // Step 3: Delete audit records (if table exists)
        console.debug('[Training] Removing audit records');
        const { error: auditError } = await supabase
          .from('training_assignment_audit')
          .delete()
          .eq('assignment_id', assignmentId);
          
        // Don't throw on audit error as table might not exist
        if (auditError) {
          console.warn('[Training] Audit deletion warning (table might not exist):', auditError);
        }

        // Step 4: Finally delete the main assignment
        console.debug('[Training] Deleting main assignment');
        const { error: deleteError } = await supabase
          .from('training_assignments')
          .delete()
          .eq('id', assignmentId);
          
        if (deleteError) {
          console.error('[Training] Failed to delete main assignment:', deleteError);
          throw deleteError;
        }

        console.debug('[Training] Bulletproof deletion completed successfully');
      } catch (error) {
        console.error('[Training] Deletion failed, operation rolled back:', error);
        throw error;
      }
    },
    onMutate: async (assignmentId: string) => {
      console.debug('[Training] Optimistic update start for:', assignmentId);
      
      // Cancel all training-related queries to prevent race conditions
      await queryClient.cancelQueries({ 
        queryKey: ['training-assignments']
      });
      
      // Snapshot current state for rollback
      const prevAssignments = queryClient.getQueryData<any[]>(['training-assignments']);
      
      // Optimistic update: Remove assignment from UI immediately
      if (Array.isArray(prevAssignments)) {
        queryClient.setQueryData(
          ['training-assignments'],
          prevAssignments.filter((a) => a?.id !== assignmentId)
        );
      }

      return { prevAssignments, assignmentId };
    },
    onError: (error, assignmentId, context) => {
      console.error('[Training] Deletion failed, rolling back UI:', error);
      
      // Rollback optimistic update
      if (context?.prevAssignments) {
        queryClient.setQueryData(['training-assignments'], context.prevAssignments);
      }
      
      toast.error(`Failed to remove assignment: ${error.message}`);
    },
    onSuccess: (_, assignmentId) => {
      console.debug('[Training] Assignment removed successfully:', assignmentId);
      toast.success('Training assignment removed');
    },
    onSettled: (_, __, assignmentId) => {
      // Surgical invalidation: Only refresh what's needed
      console.debug('[Training] Performing surgical query refresh for:', assignmentId);
      
      // Only invalidate training-assignments, avoid employee-progress cascade
      queryClient.invalidateQueries({ 
        queryKey: ['training-assignments'],
        refetchType: 'active',
        exact: true // Prevent over-broad invalidation
      });
      
      // Don't invalidate employee-progress or training-stats to prevent freeze
      console.debug('[Training] Deletion settled without cascading invalidations');
    },
    retry: 0, // Never retry deletions to avoid duplicate operations
  });
};
