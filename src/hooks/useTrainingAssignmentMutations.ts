import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Focused mutations for training_assignments table
export const useDeleteTrainingAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('training_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Refresh relevant training views
      queryClient.invalidateQueries({ queryKey: ['employee-progress'] });
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });

      toast.success('Training assignment removed');
    },
    onError: (error: Error) => {
      console.error('Error deleting training assignment:', error);
      toast.error('Failed to remove training assignment');
    },
  });
};
