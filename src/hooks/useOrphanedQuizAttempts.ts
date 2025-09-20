import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export interface OrphanedAttempt {
  attempt_id: string;
  quiz_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  attempt_number: number;
  score: number;
  max_score: number;
  passed: boolean;
  started_at: string;
  completed_at: string;
  answers_count: number;
  has_overrides: boolean;
}

// Hook to fetch orphaned quiz attempts
export const useOrphanedQuizAttempts = () => {
  const { user } = useAuth();
  const isAdmin = user && ['admin', 'superadmin', 'manager'].includes(user.role);

  return useQuery({
    queryKey: ['orphaned-quiz-attempts', user?.organizationId],
    queryFn: async (): Promise<OrphanedAttempt[]> => {
      if (!user?.organizationId || !isAdmin) return [];

      try {
        // Get all quiz attempts with user info
        const { data: attempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            users!inner(name, email)
          `)
          .eq('organization_id', user.organizationId)
          .order('started_at', { ascending: false });

        if (attemptsError) {
          console.error('Error fetching quiz attempts:', attemptsError);
          throw attemptsError;
        }

        if (!attempts || attempts.length === 0) {
          return [];
        }

        // Check which quizzes still exist
        const quizIds = [...new Set(attempts.map(a => a.quiz_id))];
        const { data: existingQuizzes, error: quizError } = await supabase
          .from('quizzes')
          .select('id')
          .in('id', quizIds);

        if (quizError) {
          console.error('Error fetching existing quizzes:', quizError);
          throw quizError;
        }

        const existingQuizIds = new Set(existingQuizzes?.map(q => q.id) || []);
        
        // Filter orphaned attempts
        const orphanedAttemptsList = attempts.filter(attempt => !existingQuizIds.has(attempt.quiz_id));
        const orphanedAttemptIds = orphanedAttemptsList.map(a => a.id);
        
        // Get overrides for orphaned attempts
        let overridesMap: Record<string, boolean> = {};
        if (orphanedAttemptIds.length > 0) {
          const { data: overrides } = await supabase
            .from('quiz_answer_overrides')
            .select('quiz_attempt_id')
            .in('quiz_attempt_id', orphanedAttemptIds);
          
          overridesMap = (overrides || []).reduce((acc, override) => {
            acc[override.quiz_attempt_id] = true;
            return acc;
          }, {} as Record<string, boolean>);
        }

        // Transform to expected format
        const orphanedData: OrphanedAttempt[] = orphanedAttemptsList.map(attempt => ({
          attempt_id: attempt.id,
          quiz_id: attempt.quiz_id,
          user_id: attempt.user_id,
          user_name: (attempt.users as any)?.name || 'Unknown User',
          user_email: (attempt.users as any)?.email || '',
          attempt_number: attempt.attempt_number,
          score: attempt.score,
          max_score: attempt.max_score,
          passed: attempt.passed,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at || attempt.started_at,
          answers_count: Array.isArray(attempt.answers) ? attempt.answers.length : 0,
          has_overrides: overridesMap[attempt.id] || false
        }));

        return orphanedData;
      } catch (error) {
        console.error('Exception in useOrphanedQuizAttempts:', error);
        throw error;
      }
    },
    enabled: !!user?.organizationId && isAdmin,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000 // Keep in cache for 1 minute
  });
};

// Hook to delete orphaned quiz attempts
export const useDeleteOrphanedAttempts = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (attemptIds: string[]) => {
      if (!user?.organizationId || attemptIds.length === 0) {
        throw new Error('Invalid parameters for deletion');
      }

      // First delete overrides
      const { error: overridesError } = await supabase
        .from('quiz_answer_overrides')
        .delete()
        .in('quiz_attempt_id', attemptIds);

      if (overridesError) {
        console.error('Error deleting overrides:', overridesError);
        throw overridesError;
      }

      // Then delete attempts
      const { error: attemptsError } = await supabase
        .from('quiz_attempts')
        .delete()
        .in('id', attemptIds);

      if (attemptsError) {
        console.error('Error deleting attempts:', attemptsError);
        throw attemptsError;
      }

      return { deletedCount: attemptIds.length };
    },
    onSuccess: (data) => {
      // Invalidate and refetch orphaned attempts
      queryClient.invalidateQueries({ queryKey: ['orphaned-quiz-attempts'] });
      
      // Also invalidate any related queries
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-results-with-names'] });
      
      enhancedNotifications.success(
        `Successfully deleted ${data.deletedCount} orphaned quiz attempts`
      );
    },
    onError: (error) => {
      console.error('Failed to delete orphaned attempts:', error);
      enhancedNotifications.error('Failed to delete orphaned attempts');
    }
  });
};

// Hook to get orphaned attempts count (for dashboard stats)
export const useOrphanedAttemptsCount = () => {
  const { data: orphanedAttempts = [] } = useOrphanedQuizAttempts();
  return { data: orphanedAttempts.length };
};