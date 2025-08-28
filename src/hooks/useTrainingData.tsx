import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedNotifications } from '@/utils/enhancedNotifications';

// Training data hooks with assignment functionality

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

// Quizzes Hook - Updated to fetch all quizzes when no moduleId provided
export const useQuizzes = (moduleId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['quizzes', moduleId, user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      
      let query = supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions(*),
          training_modules!inner(
            training_courses!inner(
              organization_id
            )
          )
        `)
        .eq('training_modules.training_courses.organization_id', user.organizationId)
        .order('created_at', { ascending: false });
      
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.organizationId
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
    mutationFn: async ({ course, modules }: { course: any, modules: any[] }) => {
      if (!user?.organizationId) throw new Error('No organization found');

      // Map course fields to match DB schema
      const coursePayload = {
        title: course.title,
        description: course.description ?? null,
        difficulty_level: course.difficulty ?? null,
        estimated_duration_minutes: typeof course.duration_hours === 'number'
          ? Math.round(course.duration_hours * 60)
          : null,
        is_active: course.is_active ?? true,
        organization_id: user.organizationId,
        created_by: user.id
      };

      // Create course first
      const { data: courseData, error: courseError } = await supabase
        .from('training_courses')
        .insert(coursePayload)
        .select()
        .single();

      if (courseError) throw courseError;

      // Create modules if provided (map to DB schema)
      if (modules.length > 0) {
        const modulesToInsert = modules.map((module: any, idx: number) => ({
          title: module.title,
          description: module.description ?? null,
          module_order: module.module_order ?? (idx + 1),
          course_id: courseData.id,
          content_type: 'text', // We only support text content from CourseCreator for now
          text_content: module.content ?? null
        }));

        const { error: modulesError } = await supabase
          .from('training_modules')
          .insert(modulesToInsert);

        if (modulesError) throw modulesError;
      }

      return courseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });
    },
    onError: (error: Error) => {
      console.error('Failed to create course:', error);
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
    },
    onError: (error: Error) => {
      console.error('Failed to create quiz:', error);
    }
  });
};

// Submit Quiz Attempt Mutation
export const useSubmitQuizAttempt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ quizId, answers, score, maxScore, passed, timeSpent }: {
      quizId: string;
      answers: any[];
      score: number;
      maxScore: number;
      passed: boolean;
      timeSpent: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!user?.organizationId) throw new Error('No organization found');
      
      // Get current attempt number for this user and quiz
      const { count: existingAttempts } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId)
        .eq('user_id', user.id);
      
      const attemptNumber = (existingAttempts || 0) + 1;
      
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          attempt_number: attemptNumber,
          score,
          max_score: maxScore,
          passed,
          answers,
          organization_id: user.organizationId,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;

      // Update assignment status if this quiz was assigned
      await supabase
        .from('training_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_score: Math.round((score / maxScore) * 100)
        })
        .eq('assigned_to', user.id)
        .eq('content_id', quizId)
        .eq('assignment_type', 'quiz')
        .in('status', ['pending', 'in_progress']);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      enhancedNotifications.success('Quiz completed successfully!');
    },
    onError: (error: any) => {
      console.error('Error submitting quiz attempt:', error);
      enhancedNotifications.error('Failed to submit quiz attempt');
    }
  });
};

// Training Assignments Hooks
export const useTrainingAssignments = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['training-assignments', targetUserId],
    queryFn: async () => {
      if (!targetUserId) throw new Error('No user ID available');
      
      const { data, error } = await supabase
        .from('training_assignments')
        .select('*')
        .eq('assigned_to', targetUserId)
        .order('assigned_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!targetUserId
  });
};

export const useCreateTrainingAssignment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      assignmentType, 
      contentId, 
      contentTitle, 
      assignedUsers, 
      dueDate, 
      priority 
    }: {
      assignmentType: 'course' | 'quiz';
      contentId: string;
      contentTitle: string;
      assignedUsers: string[];
      dueDate?: string;
      priority: string;
    }) => {
      if (!user?.id || !user?.organizationId) throw new Error('User not authenticated');
      
      // Create assignment records for each user
      const assignments = assignedUsers.map(userId => ({
        organization_id: user.organizationId,
        assigned_by: user.id,
        assigned_to: userId,
        assignment_type: assignmentType,
        content_id: contentId,
        content_title: contentTitle,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        status: 'pending'
      }));

      const { data, error } = await supabase
        .from('training_assignments')
        .insert(assignments)
        .select();

      if (error) throw error;

      // Create notifications for assigned users
      const notifications = assignedUsers.map(userId => ({
        user_id: userId,
        organization_id: user.organizationId,
        type: 'training_assignment',
        title: `New ${assignmentType} assigned`,
        content: `You have been assigned: ${contentTitle}${dueDate ? ` (Due: ${new Date(dueDate).toLocaleDateString()})` : ''}`,
        metadata: {
          assignment_type: assignmentType,
          content_id: contentId,
          assigned_by: user.id
        }
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) {
        console.warn('Failed to create notifications:', notificationError);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      enhancedNotifications.success(`Successfully assigned to ${data.length} user${data.length !== 1 ? 's' : ''}`);
    },
    onError: (error: any) => {
      console.error('Error creating training assignment:', error);
      enhancedNotifications.error('Failed to create assignment');
    }
  });
};

export const useUpdateAssignmentStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      status, 
      startedAt 
    }: {
      assignmentId: string;
      status: 'in_progress' | 'completed';
      startedAt?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const updateData: any = { status };
      if (status === 'in_progress' && startedAt) {
        updateData.started_at = startedAt;
      }

      const { data, error } = await supabase
        .from('training_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .eq('assigned_to', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
    },
    onError: (error: any) => {
      console.error('Error updating assignment status:', error);
      enhancedNotifications.error('Failed to update assignment status');
    }
  });
};