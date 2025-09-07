import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { enhancedNotifications } from '@/utils/enhancedNotifications';
import { useAuth } from '@/contexts/AuthContext';

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

// Single Quiz Hook - Enhanced with direct question fetching fallback
export const useQuiz = (quizId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['quiz', quizId, user?.organizationId],
    queryFn: async () => {
      if (!quizId || !user?.organizationId) return null;
      
      console.log('🔍 useQuiz: Fetching quiz data for:', { quizId, orgId: user.organizationId });
      
      try {
        // Try direct quiz fetch first (without questions embed to avoid PostgREST issues)
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .select(`
            *,
            training_modules!inner(
              training_courses!inner(
                organization_id
              )
            )
          `)
          .eq('id', quizId)
          .eq('training_modules.training_courses.organization_id', user.organizationId)
          .single();
        
        if (quizError) {
          console.warn('⚠️ useQuiz: Organization-filtered fetch failed:', quizError.message);
          
          // Fallback: Try direct quiz fetch without org filter
          const { data: directQuiz, error: directError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single();
          
          if (directError) {
            console.error('❌ useQuiz: All quiz fetch attempts failed:', directError);
            throw directError;
          }
          
          console.log('⚠️ useQuiz: Using direct fetch (no org validation):', {
            quizId,
            title: directQuiz?.title
          });
          
          // Fetch questions separately for the direct quiz
          const { data: questions } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quizId)
            .order('question_order', { ascending: true });
          
          return {
            ...directQuiz,
            quiz_questions: questions || []
          };
        }
        
        // Fetch questions separately for better reliability
        const { data: questions } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('question_order', { ascending: true });
        
        const result = {
          ...quiz,
          quiz_questions: questions || []
        };
        
        console.log('✅ useQuiz: Successfully fetched quiz with separate questions:', {
          quizId,
          title: result?.title,
          questionsCount: result?.quiz_questions?.length || 0,
          hasQuestions: !!result?.quiz_questions?.length,
          questionsPreview: result?.quiz_questions?.slice(0, 3).map(q => ({ 
            id: q.id, 
            type: q.question_type,
            text: q.question_text?.substring(0, 50) + '...' 
          }))
        });
        
        return result;
      } catch (error) {
        console.error('❌ useQuiz: All fetch attempts failed:', error);
        throw error;
      }
    },
    enabled: !!quizId && !!user?.organizationId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
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

// Enhanced Employee Progress Hook with Team Information
export const useEmployeeProgress = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['employee-progress', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) return [];
      
      // Get all users in the organization with team information
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id, 
          name, 
          email, 
          role, 
          department, 
          job_title,
          hire_date
        `)
        .eq('organization_id', user.organizationId);
      
      if (usersError) throw usersError;
      
      const employeeProgress = await Promise.all(
        (users || []).map(async (employee) => {
          // Get team memberships for this employee
          const { data: teamMemberships } = await supabase
            .from('team_memberships')
            .select(`
              team_id,
              role,
              teams (
                id,
                name,
                description
              )
            `)
            .eq('user_id', employee.id);
          
          // Get training assignments for this employee with certificate data
          const { data: assignments } = await supabase
            .from('training_assignments')
            .select(`
              *,
              certificate_url,
              certificate_status,
              certificate_uploaded_at,
              verified_at,
              verified_by,
              verification_notes
            `)
            .eq('assigned_to', employee.id)
            .order('assigned_at', { ascending: false });
          
          // Get quiz attempts for this employee
          const { data: quizAttempts } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('user_id', employee.id)
            .eq('organization_id', user.organizationId);
          
          // Get training progress for this employee
          const { data: trainingProgress } = await supabase
            .from('user_training_progress')
            .select('*')
            .eq('user_id', employee.id)
            .eq('organization_id', user.organizationId);
          
          const totalAssignments = assignments?.length || 0;
          const completedAssignments = assignments?.filter(a => a.status === 'completed').length || 0;
          const inProgressAssignments = assignments?.filter(a => a.status === 'in_progress').length || 0;
          const pendingAssignments = assignments?.filter(a => a.status === 'pending').length || 0;
          const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
          
          // Calculate average quiz score
          const passedAttempts = quizAttempts?.filter(attempt => attempt.passed) || [];
          const averageQuizScore = passedAttempts.length > 0 
            ? Math.round(passedAttempts.reduce((sum, attempt) => sum + (attempt.score / attempt.max_score * 100), 0) / passedAttempts.length)
            : null;
          
          // Get last activity date from multiple sources
          const activityDates = [
            ...(assignments?.map(a => new Date(a.updated_at || a.assigned_at || 0)) || []),
            ...(quizAttempts?.map(a => new Date(a.completed_at || a.started_at || 0)) || []),
            ...(trainingProgress?.map(p => new Date(p.last_accessed_at || 0)) || [])
          ].filter(date => date.getTime() > 0);
          
          const lastActivity = activityDates.length > 0 
            ? new Date(Math.max(...activityDates.map(d => d.getTime())))
            : null;
          
          return {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            department: employee.department || 'Unassigned',
            jobTitle: employee.job_title || '',
            hireDate: employee.hire_date,
            teams: teamMemberships?.map(tm => ({
              id: tm.team_id,
              name: (tm.teams as any)?.name || 'Unknown Team',
              role: tm.role
            })) || [],
            totalAssignments,
            completedAssignments,
            inProgressAssignments,
            pendingAssignments,
            completionRate,
            averageQuizScore,
            coursesCompleted: assignments?.filter(a => a.assignment_type === 'course' && a.status === 'completed').length || 0,
            quizzesCompleted: assignments?.filter(a => a.assignment_type === 'quiz' && a.status === 'completed').length || 0,
            certificatesUploaded: assignments?.filter(a => a.certificate_status === 'uploaded' || a.certificate_status === 'verified').length || 0,
            certificatesVerified: assignments?.filter(a => a.certificate_status === 'verified').length || 0,
            lastActivity,
            assignments: assignments || []
          };
        })
      );
      
      return employeeProgress;
    },
    enabled: !!user?.organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10 // 10 minutes (formerly cacheTime)
  });
};

// Quiz Results with User Names Hook (Enhanced with Overrides using Database Function)
export const useQuizResultsWithNames = (quizId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['quiz-results-with-names', quizId, user?.organizationId],
    queryFn: async () => {
      if (!quizId || !user?.organizationId) return [];
      
      try {
        // Use the improved database function to get attempts with final scores
        const { data: attempts, error } = await supabase.rpc(
          'get_quiz_attempts_with_final_scores',
          { 
            quiz_id_param: quizId, 
            organization_id_param: user.organizationId 
          }
        );

        if (error) {
          console.error('Database function error:', error);
          // Fallback to manual calculation on database function failure
          return await fallbackManualCalculation(quizId, user.organizationId);
        }

        if (!attempts || attempts.length === 0) {
          return [];
        }

        // Fetch all overrides for these attempts for additional context
        const attemptIds = attempts.map((attempt: any) => attempt.id);
        const { data: overrides = [] } = await supabase
          .from('quiz_answer_overrides')
          .select('*')
          .in('quiz_attempt_id', attemptIds);

        // Group overrides by attempt ID
        const overridesMap = overrides.reduce((acc: any, override: any) => {
          if (!acc[override.quiz_attempt_id]) {
            acc[override.quiz_attempt_id] = [];
          }
          acc[override.quiz_attempt_id].push(override);
          return acc;
        }, {});

        return attempts.map((attempt: any) => ({
          ...attempt,
          // Ensure user data is properly structured
          user: {
            name: attempt.name || 'Unknown User',
            email: attempt.email || '',
            role: attempt.role || 'user'
          },
          // Also keep the users property for backward compatibility
          users: {
            name: attempt.name || 'Unknown User',
            email: attempt.email || '',
            role: attempt.role || 'user'
          },
          overrides: overridesMap[attempt.id] || [],
          // Use database function results with fallbacks
          score: attempt.original_score || 0,
          passed: attempt.original_passed || false,
          adjusted_score: attempt.final_score || attempt.original_score || 0,
          adjusted_passed: attempt.final_passed || attempt.original_passed || false,
          has_overrides: attempt.has_overrides || false,
          total_adjustment: attempt.total_adjustment || 0,
          override_count: attempt.override_count || 0
        }));
        
      } catch (error) {
        console.error('Error in useQuizResultsWithNames:', error);
        // Fallback to manual calculation if database function fails
        return await fallbackManualCalculation(quizId, user.organizationId);
      }
    },
    enabled: !!quizId && !!user?.organizationId,
    retry: 1, // Only retry once to avoid infinite loops
    staleTime: 30000 // Cache results for 30 seconds
  });
};

// Enhanced fallback function for manual calculation with better error handling
const fallbackManualCalculation = async (quizId: string, organizationId: string) => {
  console.warn('Using fallback manual calculation for quiz results');
  
  try {
    // Get quiz attempts with user data
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        users!inner(name, email, role)
      `)
      .eq('quiz_id', quizId)
      .eq('organization_id', organizationId)
      .order('started_at', { ascending: false });

    if (attemptsError) {
      console.error('Error fetching quiz attempts in fallback:', attemptsError);
      throw attemptsError;
    }

    if (!attempts || attempts.length === 0) {
      return [];
    }

    // Get all overrides for these attempts
    const attemptIds = attempts.map(attempt => attempt.id);
    let overrides: any[] = [];
    
    if (attemptIds.length > 0) {
      const { data: overridesData, error: overridesError } = await supabase
        .from('quiz_answer_overrides')
        .select('*')
        .in('quiz_attempt_id', attemptIds);
      
      if (overridesError) {
        console.error('Error fetching overrides in fallback:', overridesError);
        // Continue without overrides rather than failing
      } else {
        overrides = overridesData || [];
      }
    }

    // Group overrides by attempt ID
    const overridesMap = overrides.reduce((acc: any, override: any) => {
      if (!acc[override.quiz_attempt_id]) {
        acc[override.quiz_attempt_id] = [];
      }
      acc[override.quiz_attempt_id].push(override);
      return acc;
    }, {});

    // Get quiz passing score
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('passing_score')
      .eq('id', quizId)
      .single();

    const passingScore = quiz?.passing_score || 70;

    return attempts.map((attempt: any) => {
      const attemptOverrides = overridesMap[attempt.id] || [];
      const totalAdjustment = attemptOverrides.reduce((sum: number, override: any) => 
        sum + ((override.override_score || 0) - (override.original_score || 0)), 0
      );
      
      const originalScore = attempt.score || 0;
      const adjustedScore = Math.max(0, originalScore + totalAdjustment);
      const maxScore = attempt.max_score || 0;
      const adjustedPercentage = maxScore > 0 ? (adjustedScore / maxScore) * 100 : 0;
      const adjustedPassed = adjustedPercentage >= passingScore;

      return {
        ...attempt,
        // Ensure proper user structure for both user and users properties
        user: {
          name: attempt.users?.name || 'Unknown User',
          email: attempt.users?.email || '',
          role: attempt.users?.role || 'user'
        },
        users: {
          name: attempt.users?.name || 'Unknown User',
          email: attempt.users?.email || '',
          role: attempt.users?.role || 'user'
        },
        // Add both original and adjusted properties for compatibility
        score: originalScore,
        passed: attempt.passed || false,
        overrides: attemptOverrides,
        adjusted_score: adjustedScore,
        adjusted_passed: adjustedPassed,
        has_overrides: attemptOverrides.length > 0,
        total_adjustment: totalAdjustment,
        override_count: attemptOverrides.length,
        // Additional properties for consistency with database function
        original_score: originalScore,
        final_score: adjustedScore,
        original_passed: attempt.passed || false,
        final_passed: adjustedPassed,
        name: attempt.users?.name || 'Unknown User',
        email: attempt.users?.email || '',
        role: attempt.users?.role || 'user'
      };
    });
  } catch (error) {
    console.error('Error in fallback manual calculation:', error);
    // Return empty array rather than throwing to prevent complete failure
    return [];
  }
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
        difficulty_level: course.difficulty ? String(course.difficulty).toLowerCase() : null,
        estimated_duration_minutes: typeof course.duration_hours === 'number'
          ? Math.round(course.duration_hours * 60)
          : null,
        is_active: course.is_active ?? true,
        organization_id: user.organizationId,
        created_by: user.id,
        // External course fields
        is_external: course.is_external ?? false,
        external_base_url: course.is_external ? course.external_url : null,
        completion_method: course.completion_method ?? 'internal',
        // Store certificate requirement in url_parameters
        url_parameters: course.is_external && course.requires_certificate 
          ? { requires_certificate: true }
          : {}
      };

      // Create course first
      const { data: courseData, error: courseError } = await supabase
        .from('training_courses')
        .insert(coursePayload)
        .select()
        .single();

      if (courseError) throw courseError;

      // Only create modules for internal courses
      if (!course.is_external && modules.length > 0) {
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

// Enhanced Submit Quiz Attempt Mutation with Assignment Score Sync
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
      if (!user) throw new Error('User not authenticated');

      // Get current attempt number
      const { data: existingAttempts } = await supabase
        .from('quiz_attempts')
        .select('attempt_number')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1;

      // Insert the quiz attempt
      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          organization_id: user.organizationId,
          attempt_number: attemptNumber,
          score,
          max_score: maxScore,
          passed,
          answers,
          started_at: new Date(Date.now() - timeSpent * 1000).toISOString(),
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting quiz attempt:', error);
        throw error;
      }

      // Calculate final score (with potential overrides)
      let finalScore = score;
      let finalPassed = passed;
      
      try {
        const { data: finalScoreData } = await supabase.rpc(
          'calculate_quiz_attempt_final_score',
          { attempt_id: attempt.id }
        );
        
        if (finalScoreData && typeof finalScoreData === 'object') {
          const scoreResult = finalScoreData as any;
          if (!scoreResult.error) {
            finalScore = scoreResult.final_score || score;
            finalPassed = scoreResult.final_passed || passed;
          }
        }
      } catch (error) {
        console.warn('Could not calculate final score, using original:', error);
      }

      // Update related training assignment if it exists
      try {
        // Find related training assignment
        const { data: assignment } = await supabase
          .from('training_assignments')
          .select('id, content_id')
          .eq('assigned_to', user.id)
          .eq('organization_id', user.organizationId)
          .eq('assignment_type', 'quiz')
          .eq('content_id', quizId)
          .in('status', ['pending', 'in_progress'])
          .single();

        if (assignment) {
          // Update assignment with completion data
          const updateData: any = {
            completion_score: Math.round((finalScore / maxScore) * 100),
            updated_at: new Date().toISOString()
          };

          // If quiz passed, mark assignment as completed
          if (finalPassed) {
            updateData.status = 'completed';
            updateData.completed_at = new Date().toISOString();
          }

          const { error: assignmentUpdateError } = await supabase
            .from('training_assignments')
            .update(updateData)
            .eq('id', assignment.id);

          if (assignmentUpdateError) {
            console.error('Error updating assignment:', assignmentUpdateError);
            // Don't throw - assignment update is secondary to quiz submission
          }
        }
      } catch (assignmentError) {
        console.warn('Could not update related training assignment:', assignmentError);
        // Don't throw - assignment update is secondary to quiz submission
      }

      // If quiz is passed with final score, mark the associated module as completed
      if (finalPassed) {
        try {
          // Get the module_id and course_id for this quiz
          const { data: quizData } = await supabase
            .from('quizzes')
            .select(`
              module_id,
              training_modules!inner(course_id)
            `)
            .eq('id', quizId)
            .single();

          if (quizData?.module_id && quizData.training_modules?.course_id) {
            // Insert or update user training progress for the module
            const { error: progressError } = await supabase
              .from('user_training_progress')
              .upsert({
                user_id: user.id,
                module_id: quizData.module_id,
                course_id: quizData.training_modules.course_id,
                organization_id: user.organizationId,
                status: 'completed',
                progress_percentage: 100,
                completed_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,course_id,module_id',
                ignoreDuplicates: false
              });

            if (progressError) {
              console.error('Failed to update module progress:', progressError);
            }
          }
        } catch (moduleError) {
          console.warn('Could not update module progress:', moduleError);
        }
      }

      return {
        ...attempt,
        final_score: finalScore,
        final_passed: finalPassed
      };
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-results-with-names'] });
      queryClient.invalidateQueries({ queryKey: ['employee-progress'] });
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-training-progress'] });
      
      console.log('Quiz attempt submitted successfully:', data);
      enhancedNotifications.success('Quiz completed successfully!');
    },
    onError: (error) => {
      console.error('Failed to submit quiz attempt:', error);
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
      
      console.log('useTrainingAssignments: Fetching assignments for user:', targetUserId);
      
      // First get the assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('training_assignments')
        .select('*')
        .eq('assigned_to', targetUserId)
        .eq('organization_id', user?.organizationId)
        .order('assigned_at', { ascending: false });
      
      if (assignmentsError) {
        console.error('useTrainingAssignments: Database error:', assignmentsError);
        throw assignmentsError;
      }
      
      if (!assignmentsData || assignmentsData.length === 0) {
        console.log('useTrainingAssignments: No assignments found for user:', targetUserId);
        return [];
      }
      
      console.log('useTrainingAssignments: Raw assignments from database:', assignmentsData.length, assignmentsData);
      
      // Separate course and quiz assignments
      const courseAssignments = assignmentsData.filter(a => a.assignment_type === 'course');
      const quizAssignments = assignmentsData.filter(a => a.assignment_type === 'quiz');
      
      // Fetch course data for course assignments
      let coursesData: any[] = [];
      if (courseAssignments.length > 0) {
        const courseIds = courseAssignments.map(a => a.content_id);
        const { data: courses, error: coursesError } = await supabase
          .from('training_courses')
          .select(`
            id,
            title,
            description,
            is_external,
            external_base_url,
            url_parameters,
            completion_method,
            difficulty_level,
            estimated_duration_minutes,
            thumbnail_url,
            tags
          `)
          .in('id', courseIds);
        
        if (coursesError) {
          console.error('useTrainingAssignments: Error fetching courses:', coursesError);
          // Don't throw on course fetch failure - continue with assignments but note the issue
          enhancedNotifications.error(`Failed to fetch course details: ${coursesError.message}`);
        } else {
          coursesData = courses || [];
          console.log('useTrainingAssignments: Fetched courses data successfully:', coursesData.length, coursesData);
          console.log('useTrainingAssignments: External courses found:', coursesData.filter(c => c.is_external).map(c => ({
            id: c.id,
            title: c.title,
            is_external: c.is_external,
            external_base_url: c.external_base_url
          })));
        }
      }
      
      // Fetch quiz data for quiz assignments
      let quizzesData: any[] = [];
      if (quizAssignments.length > 0) {
        const quizIds = quizAssignments.map(a => a.content_id);
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select(`
            id,
            title,
            description,
            passing_score,
            max_attempts,
            time_limit_minutes
          `)
          .in('id', quizIds);
        
        if (quizzesError) {
          console.error('useTrainingAssignments: Error fetching quizzes:', quizzesError);
        } else {
          quizzesData = quizzes || [];
          console.log('useTrainingAssignments: Fetched quizzes data:', quizzesData.length, quizzesData);
        }
      }
      
      // Create maps for efficient lookup
      const coursesMap = new Map(coursesData.map(course => [course.id, course]));
      const quizzesMap = new Map(quizzesData.map(quiz => [quiz.id, quiz]));
      
      // Process the data to ensure consistent structure
      const processedData = assignmentsData.map(assignment => {
        console.log('useTrainingAssignments: Processing assignment:', assignment.id, assignment.assignment_type, assignment.content_title);
        
        // For course assignments, attach training_courses data
        if (assignment.assignment_type === 'course') {
          const courseData = coursesMap.get(assignment.content_id);
          if (courseData) {
            console.log('useTrainingAssignments: Course assignment with training_courses data:', courseData);
            return {
              ...assignment,
              // Attach course data in the expected structure
              training_courses: courseData,
              course_data: courseData
            };
          } else {
            console.warn('useTrainingAssignments: Course assignment missing training_courses data:', assignment.id);
            return assignment;
          }
        }
        // For quiz assignments, attach quizzes data
        else if (assignment.assignment_type === 'quiz') {
          const quizData = quizzesMap.get(assignment.content_id);
          if (quizData) {
            console.log('useTrainingAssignments: Quiz assignment with quizzes data:', quizData);
            return {
              ...assignment,
              // Attach quiz data in the expected structure
              quizzes: quizData,
              quiz_data: quizData
            };
          } else {
            console.warn('useTrainingAssignments: Quiz assignment missing quizzes data:', assignment.id);
            return assignment;
          }
        }
        // Return assignment as-is for unknown types
        else {
          console.warn('useTrainingAssignments: Unknown assignment type:', assignment.assignment_type);
          return assignment;
        }
      });
      
      // Filter and validate processed data
      const validAssignments = processedData.filter(assignment => {
        const isValid = assignment && assignment.id && assignment.content_title;
        if (!isValid) {
          console.warn('useTrainingAssignments: Invalid assignment filtered out:', assignment);
        }
        return isValid;
      });
      
      console.log('useTrainingAssignments: Final processed assignments:', validAssignments.length);
      console.log('useTrainingAssignments: Assignment breakdown:', {
        total: validAssignments.length,
        pending: validAssignments.filter(a => a.status === 'pending').length,
        in_progress: validAssignments.filter(a => a.status === 'in_progress').length,
        completed: validAssignments.filter(a => a.status === 'completed').length,
        courses: validAssignments.filter(a => a.assignment_type === 'course').length,
        quizzes: validAssignments.filter(a => a.assignment_type === 'quiz').length,
        external_courses: validAssignments.filter(a => 
          a.assignment_type === 'course' && 
          (a as any).training_courses?.is_external
        ).length
      });
      
      return validAssignments;
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

// Update Course Mutation
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ courseId, course, modules }: { courseId: string, course: any, modules: any[] }) => {
      if (!user?.organizationId) throw new Error('No organization found');

      // Map course fields to match DB schema
      const coursePayload = {
        title: course.title,
        description: course.description ?? null,
        difficulty_level: course.difficulty ? String(course.difficulty).toLowerCase() : null,
        estimated_duration_minutes: typeof course.duration_hours === 'number'
          ? Math.round(course.duration_hours * 60)
          : null,
        is_active: course.is_active ?? true,
        updated_at: new Date().toISOString()
      };

      // Update course
      const { data: courseData, error: courseError } = await supabase
        .from('training_courses')
        .update(coursePayload)
        .eq('id', courseId)
        .eq('organization_id', user.organizationId)
        .select()
        .maybeSingle()

      if (courseError) throw courseError;

      // Handle modules updates
      if (modules.length > 0) {
        // First, get existing modules
        const { data: existingModules } = await supabase
          .from('training_modules')
          .select('id')
          .eq('course_id', courseId);

        const existingModuleIds = existingModules?.map(m => m.id) || [];
        const moduleUpdates = [];
        const moduleInserts = [];
        const moduleIdsToKeep = [];

        for (const module of modules) {
          const contentType = module.content_type || 'text';
          const modulePayload = {
            title: module.title,
            description: module.description ?? null,
            module_order: module.module_order,
            course_id: courseId,
            content_type: contentType,
            text_content: (contentType === 'text' || contentType === 'mixed') ? (module.content ?? null) : null,
            youtube_video_id: (contentType === 'video' || contentType === 'mixed') ? (module.youtube_video_id ?? null) : null,
            updated_at: new Date().toISOString()
          };

          if (module.id && existingModuleIds.includes(module.id)) {
            // Update existing module
            moduleUpdates.push({ ...modulePayload, id: module.id });
            moduleIdsToKeep.push(module.id);
          } else {
            // Insert new module
            moduleInserts.push(modulePayload);
          }
        }

        // Update existing modules
        for (const moduleUpdate of moduleUpdates) {
          const { id, ...updateData } = moduleUpdate;
          await supabase
            .from('training_modules')
            .update(updateData)
            .eq('id', id);
        }

        // Insert new modules
        if (moduleInserts.length > 0) {
          await supabase
            .from('training_modules')
            .insert(moduleInserts);
        }

        // Delete modules that are no longer needed
        const modulesToDelete = existingModuleIds.filter(id => !moduleIdsToKeep.includes(id));
        if (modulesToDelete.length > 0) {
          await supabase
            .from('training_modules')
            .delete()
            .in('id', modulesToDelete);
        }
      }

      return courseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update course:', error);
    }
  });
};

// Delete Course Mutation
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.organizationId) throw new Error('No organization found');

      const { error } = await supabase
        .from('training_courses')
        .delete()
        .eq('id', courseId)
        .eq('organization_id', user.organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });
    },
    onError: (error: Error) => {
      console.error('Failed to delete course:', error);
    }
  });
};

// Update Quiz Mutation
export const useUpdateQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ quizId, quiz, questions }: { quizId: string, quiz: any, questions: any[] }) => {
      // Update quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .update({
          title: quiz.title,
          description: quiz.description,
          module_id: quiz.module_id,
          passing_score: quiz.passing_score,
          max_attempts: quiz.max_attempts,
          time_limit_minutes: quiz.time_limit_minutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', quizId)
        .select()
        .single();
      
      if (quizError) throw quizError;
      
      // Handle questions updates
      if (questions.length > 0) {
        // Get existing questions
        const { data: existingQuestions } = await supabase
          .from('quiz_questions')
          .select('id')
          .eq('quiz_id', quizId);

        const existingQuestionIds = existingQuestions?.map(q => q.id) || [];
        const questionUpdates = [];
        const questionInserts = [];
        const questionIdsToKeep = [];

        for (const question of questions) {
          const questionPayload = {
            quiz_id: quizId,
            question_text: question.question_text,
            question_type: question.question_type,
            options: question.options,
            correct_answer: question.correct_answer,
            points: question.points,
            explanation: question.explanation,
            question_order: question.question_order
          };

          if (question.id && existingQuestionIds.includes(question.id)) {
            // Update existing question
            questionUpdates.push({ ...questionPayload, id: question.id });
            questionIdsToKeep.push(question.id);
          } else {
            // Insert new question
            questionInserts.push(questionPayload);
          }
        }

        // Update existing questions
        for (const questionUpdate of questionUpdates) {
          const { id, ...updateData } = questionUpdate;
          const { error: updateError } = await supabase
            .from('quiz_questions')
            .update(updateData)
            .eq('id', id);
          
          if (updateError) {
            console.error('Error updating question:', updateError);
            throw updateError;
          }
        }

        // Insert new questions
        if (questionInserts.length > 0) {
          const { error: insertError } = await supabase
            .from('quiz_questions')
            .insert(questionInserts);
          
          if (insertError) {
            console.error('Error inserting questions:', insertError);
            throw insertError;
          }
        }

        // Delete questions that are no longer needed
        const questionsToDelete = existingQuestionIds.filter(id => !questionIdsToKeep.includes(id));
        if (questionsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('quiz_questions')
            .delete()
            .in('id', questionsToDelete);
          
          if (deleteError) {
            console.error('Error deleting questions:', deleteError);
            throw deleteError;
          }
        }
      }
      
      return quizData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update quiz:', error);
    }
  });
};

// Delete Quiz Mutation
export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quizId: string) => {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['training-stats'] });
    },
    onError: (error: Error) => {
      console.error('Failed to delete quiz:', error);
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