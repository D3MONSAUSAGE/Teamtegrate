import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface TrainingAssignment {
  id: string;
  assigned_to: string;
  assigned_by: string;
  assignment_type: 'course' | 'quiz' | 'compliance_training';
  content_id: string;
  status: string;
  assigned_at: string;
  due_date: string | null;
  completed_at: string | null;
  users?: {
    id: string;
    name: string;
    email: string;
  } | null;
  training_courses?: {
    id: string;
    title: string;
    description: string | null;
  } | null;
  quizzes?: {
    id: string;
    title: string;
    description: string | null;
  } | null;
  compliance_training_templates?: {
    id: string;
    title: string;
    description: string | null;
  } | null;
}

interface UseTrainingAssignmentsParams {
  status?: 'all' | 'pending' | 'in_progress' | 'completed';
  assignmentType?: 'course' | 'quiz' | 'compliance_training';
  userId?: string;
  contentId?: string;
}

export const useTrainingAssignments = (params: UseTrainingAssignmentsParams = {}) => {
  return useQuery({
    queryKey: ['training-assignments', params],
    queryFn: async () => {
      let query = supabase
        .from('training_assignments')
        .select(`
          *,
          users!training_assignments_assigned_to_fkey (
            id,
            name,
            email
          ),
          training_courses (
            id,
            title,
            description
          ),
          quizzes (
            id,
            title,
            description
          ),
          compliance_training_templates (
            id,
            title,
            description
          )
        `)
        .order('assigned_at', { ascending: false });

      // Apply filters
      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      if (params.assignmentType) {
        query = query.eq('assignment_type', params.assignmentType);
      }

      if (params.userId) {
        query = query.eq('assigned_to', params.userId);
      }

      if (params.contentId) {
        query = query.eq('content_id', params.contentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching training assignments:', error);
        throw error;
      }

      return (data || []) as any;
    },
    staleTime: 30000,
  });
};

export const useDeleteTrainingAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('training_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      return assignmentId;
    },
    onMutate: async (assignmentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['training-assignments'] });

      // Snapshot the previous value
      const previousAssignments = queryClient.getQueryData(['training-assignments']);

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: ['training-assignments'] },
        (old: any) => {
          if (!old) return old;
          return old.filter((assignment: any) => assignment.id !== assignmentId);
        }
      );

      return { previousAssignments };
    },
    onError: (err, assignmentId, context) => {
      // Rollback on error
      if (context?.previousAssignments) {
        queryClient.setQueryData(['training-assignments'], context.previousAssignments);
      }
      console.error('Error deleting assignment:', err);
    },
    onSettled: () => {
      // Refetch after mutation completes
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
    },
  });
};
