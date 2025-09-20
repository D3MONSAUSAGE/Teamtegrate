import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { toast } from '@/components/ui/sonner';

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
      console.log('🔥 Creating quiz override:', {
        overrideData,
        userId: user?.id,
        userRole: user?.role,
        orgId: user?.organizationId
      });

      if (!user || !['admin', 'superadmin', 'manager'].includes(user.role)) {
        console.error('❌ Unauthorized user role:', { userId: user?.id, role: user?.role });
        throw new Error('Unauthorized: Only admins, superadmins, and managers can create overrides');
      }

      const insertData = {
        ...overrideData,
        organization_id: user.organizationId,
        overridden_by: user.id,
      };

      console.log('📝 Inserting override data:', insertData);

      const { data, error } = await supabase
        .from('quiz_answer_overrides')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('💥 Supabase insert error:', error);
        throw error;
      }

      console.log('✅ Override created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Override creation success callback:', data);
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['quiz-overrides', data.quiz_attempt_id] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      
      // Success notification is now handled in the component for better UX
    },
    onError: (error: any) => {
      console.error('💥 Override creation error callback:', error);
      
      // Enhanced error logging
      const errorInfo = {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      };
      console.error('💥 Detailed error info:', errorInfo);
      
      // Error notification is now handled in the component for better UX
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
      console.log('🔄 Updating quiz override:', {
        overrideId,
        updates,
        userId: user?.id,
        userRole: user?.role
      });

      if (!user || !['admin', 'superadmin', 'manager'].includes(user.role)) {
        console.error('❌ Unauthorized user role for update:', { userId: user?.id, role: user?.role });
        throw new Error('Unauthorized: Only admins, superadmins, and managers can update overrides');
      }

      if (!overrideId) {
        console.error('❌ Missing override ID for update');
        throw new Error('Invalid override ID');
      }

      console.log('📝 Updating override in database:', { overrideId, updates });

      const { data, error } = await supabase
        .from('quiz_answer_overrides')
        .update(updates)
        .eq('id', overrideId)
        .select()
        .single();

      if (error) {
        console.error('💥 Supabase update error:', error);
        throw error;
      }

      console.log('✅ Override updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('🎉 Override update success callback:', data);
      
      queryClient.invalidateQueries({ queryKey: ['quiz-overrides', data.quiz_attempt_id] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      
      // Success notification is now handled in the component for better UX
    },
    onError: (error: any) => {
      console.error('💥 Override update error callback:', error);
      
      // Enhanced error logging
      const errorInfo = {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      };
      console.error('💥 Detailed update error info:', errorInfo);
      
      // Error notification is now handled in the component for better UX
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