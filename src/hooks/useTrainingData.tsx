import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

// Training Courses Hook
export const useTrainingCourses = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['training-courses', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      
      const { data, error } = await supabase
        .from('training_courses')
        .select(`
          *,
          training_modules(
            id,
            title,
            description,
            module_order,
            quizzes(
              id,
              title,
              description
            )
          )
        `)
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId
  });
};

// Training Modules Hook
export const useTrainingModules = (courseId?: string) => {
  return useQuery({
    queryKey: ['training-modules', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('module_order');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId
  });
};

// Quizzes Hook
export const useQuizzes = (moduleId?: string) => {
  return useQuery({
    queryKey: ['quizzes', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions(*)
        `)
        .eq('module_id', moduleId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleId
  });
};

// Quiz Attempts Hook
export const useQuizAttempts = (quizId?: string, userId?: string) => {
  return useQuery({
    queryKey: ['quiz-attempts', quizId, userId],
    queryFn: async () => {
      const query = supabase
        .from('quiz_attempts')
        .select('*')
        .order('started_at', { ascending: false });
      
      if (quizId) query.eq('quiz_id', quizId);
      if (userId) query.eq('user_id', userId);
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  });
};

// Training Statistics Hook
export const useTrainingStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['training-stats', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return null;
      
      // Get courses count
      const { count: coursesCount } = await supabase
        .from('training_courses')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId);
      
      // Get course IDs for the organization
      const { data: courses } = await supabase
        .from('training_courses')
        .select('id')
        .eq('organization_id', user.organizationId);
      
      const courseIds = courses?.map(c => c.id) || [];
      
      // Get total modules count
      const { count: modulesCount } = await supabase
        .from('training_modules')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds);
      
      // Get module IDs
      const { data: modules } = await supabase
        .from('training_modules')
        .select('id')
        .in('course_id', courseIds);
      
      const moduleIds = modules?.map(m => m.id) || [];
      
      // Get total quizzes count
      const { count: quizzesCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .in('module_id', moduleIds);
      
      // Get quiz attempts count
      const { count: attemptsCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId);
      
      // Get passed attempts count
      const { count: passedCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .eq('passed', true);
      
      return {
        total_courses: coursesCount || 0,
        total_modules: modulesCount || 0,
        total_quizzes: quizzesCount || 0,
        total_attempts: attemptsCount || 0,
        passed_attempts: passedCount || 0,
        completion_rate: attemptsCount ? Math.round((passedCount || 0) / attemptsCount * 100) : 0
      };
    },
    enabled: !!user?.organizationId
  });
};

// Create Course Mutation
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (courseData: any) => {
      if (!user?.organizationId) throw new Error('No organization found');
      
      const { data, error } = await supabase
        .from('training_courses')
        .insert({
          ...courseData,
          organization_id: user.organizationId,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });
      toast.success('Course created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create course: ${error.message}`);
    }
  });
};

// Create Quiz Mutation
export const useCreateQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quiz, questions }: { quiz: any, questions: any[] }) => {
      // Create quiz first
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert(quiz)
        .select()
        .single();
      
      if (quizError) throw quizError;
      
      // Create questions
      if (questions.length > 0) {
        const questionsWithQuizId = questions.map((q, index) => ({
          ...q,
          quiz_id: quizData.id,
          question_order: index + 1
        }));
        
        const { error: questionsError } = await supabase
          .from('quiz_questions')
          .insert(questionsWithQuizId);
        
        if (questionsError) throw questionsError;
      }
      
      return quizData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });
      toast.success('Quiz created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create quiz: ${error.message}`);
    }
  });
};

// Submit Quiz Attempt Mutation
export const useSubmitQuizAttempt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (attemptData: any) => {
      if (!user?.organizationId) throw new Error('No organization found');
      
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          ...attemptData,
          user_id: user.id,
          organization_id: user.organizationId,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });
      toast.success('Quiz submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit quiz: ${error.message}`);
    }
  });
};