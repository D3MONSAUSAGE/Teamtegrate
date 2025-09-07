import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: any;
  correct_answer: string;
  points: number;
  explanation?: string;
  question_order: number;
}

/**
 * Direct quiz questions fetcher - bypasses PostgREST embed issues
 * This hook fetches quiz questions directly, avoiding the nested embed problems
 * that can cause questions to appear as empty arrays intermittently.
 */
export const useQuizQuestions = (quizId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['quiz-questions', quizId, user?.organizationId],
    queryFn: async () => {
      if (!quizId || !user?.organizationId) return [];
      
      console.log('🔍 useQuizQuestions: Fetching questions for quiz:', quizId);
      
      try {
        // Direct fetch of quiz questions
        const { data: questions, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('question_order', { ascending: true });
        
        if (error) {
          console.error('❌ useQuizQuestions: Failed to fetch questions:', error);
          throw error;
        }
        
        console.log('✅ useQuizQuestions: Successfully fetched questions:', {
          quizId,
          count: questions?.length || 0,
          questions: questions?.map(q => ({
            id: q.id,
            type: q.question_type,
            order: q.question_order,
            text: q.question_text?.substring(0, 50) + '...'
          }))
        });
        
        return questions || [];
      } catch (error) {
        console.error('❌ useQuizQuestions: Exception:', error);
        throw error;
      }
    },
    enabled: !!quizId && !!user?.organizationId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10 // Keep in memory for 10 minutes
  });
};

/**
 * Enhanced quiz question count hook for quick validation
 */
export const useQuizQuestionCount = (quizId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['quiz-question-count', quizId, user?.organizationId],
    queryFn: async () => {
      if (!quizId) return 0;
      
      const { count, error } = await supabase
        .from('quiz_questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId);
      
      if (error) {
        console.error('Error fetching question count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!quizId && !!user?.organizationId,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
};