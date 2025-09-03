import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface QuizAnswerOverride {
  id: string;
  organization_id: string;
  quiz_attempt_id: string;
  question_id: string;
  original_score: number;
  override_score: number;
  reason: string;
  overridden_by: string;
  overridden_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOverrideData {
  quiz_attempt_id: string;
  question_id: string;
  original_score: number;
  override_score: number;
  reason: string;
}

// Hook to fetch overrides for a quiz attempt
export const useQuizOverrides = (quizAttemptId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quiz-overrides', quizAttemptId],
    queryFn: async () => {
      if (!quizAttemptId) return [];

      const { data, error } = await supabase
        .from('quiz_answer_overrides')
        .select('*')
        .eq('quiz_attempt_id', quizAttemptId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quiz overrides:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!quizAttemptId && !!user && ['admin', 'superadmin', 'manager'].includes(user.role),
  });
};

// Hook to create a new override
export const useCreateQuizOverride = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (overrideData: CreateOverrideData) => {
      if (!user || !['admin', 'superadmin', 'manager'].includes(user.role)) {
        throw new Error('Unauthorized to create overrides');
      }

      const { data, error } = await supabase
        .from('quiz_answer_overrides')
        .insert({
          ...overrideData,
          organization_id: user.organizationId,
          overridden_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['quiz-overrides', data.quiz_attempt_id] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      
      toast({
        title: "Override Applied",
        description: "Quiz answer has been manually overridden successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating quiz override:', error);
      toast({
        title: "Error",
        description: "Failed to apply override. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Hook to update an existing override
export const useUpdateQuizOverride = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      overrideId, 
      updates 
    }: { 
      overrideId: string; 
      updates: Partial<Pick<QuizAnswerOverride, 'override_score' | 'reason'>> 
    }) => {
      if (!user || !['admin', 'superadmin', 'manager'].includes(user.role)) {
        throw new Error('Unauthorized to update overrides');
      }

      const { data, error } = await supabase
        .from('quiz_answer_overrides')
        .update(updates)
        .eq('id', overrideId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-overrides', data.quiz_attempt_id] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      
      toast({
        title: "Override Updated",
        description: "Quiz override has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating quiz override:', error);
      toast({
        title: "Error",
        description: "Failed to update override. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Hook to delete an override (remove manual intervention)
export const useDeleteQuizOverride = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (overrideId: string) => {
      if (!user || !['admin', 'superadmin', 'manager'].includes(user.role)) {
        throw new Error('Unauthorized to delete overrides');
      }

      // First get the override data for cleanup
      const { data: overrideData } = await supabase
        .from('quiz_answer_overrides')
        .select('quiz_attempt_id')
        .eq('id', overrideId)
        .single();

      const { error } = await supabase
        .from('quiz_answer_overrides')
        .delete()
        .eq('id', overrideId);

      if (error) throw error;
      return overrideData;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['quiz-overrides', data.quiz_attempt_id] });
        queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      }
      
      toast({
        title: "Override Removed",
        description: "Manual override has been removed. Score reverted to original.",
      });
    },
    onError: (error) => {
      console.error('Error deleting quiz override:', error);
      toast({
        title: "Error",
        description: "Failed to remove override. Please try again.",
        variant: "destructive",
      });
    },
  });
};