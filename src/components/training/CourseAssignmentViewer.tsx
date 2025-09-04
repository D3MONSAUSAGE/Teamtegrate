import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Video,
  FileText,
  Award,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { enhancedNotifications } from '@/utils/enhancedNotifications';
import ModuleViewer from './ModuleViewer';
import VideoToQuizFlow from './VideoToQuizFlow';
import QuizTaker from './QuizTaker';
import { useQueryClient } from '@tanstack/react-query';
import { useQuizAttempts } from '@/hooks/useTrainingData';

interface CourseAssignmentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
  onComplete?: () => void;
}

interface CourseModule {
  id: string;
  title: string;
  description?: string;
  content?: string;
  text_content?: string;
  content_type: string;
  youtube_video_id?: string;
  duration_minutes?: number;
  module_order: number;
  quizzes?: Quiz[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
}

interface UserProgress {
  user_id: string;
  course_id: string;
  module_id?: string;
  status: string;
  progress_percentage: number;
  video_progress_percentage: number;
  video_completed_at?: string;
  started_at?: string;
  completed_at?: string;
  last_accessed_at: string;
  organization_id: string;
}

const CourseAssignmentViewer: React.FC<CourseAssignmentViewerProps> = ({
  open,
  onOpenChange,
  assignment,
  onComplete
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleCompleteAssignment = async () => {
    try {
      await supabase
        .from('training_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_score: 100
        })
        .eq('id', assignment.id);

      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing assignment:', error);
    }
  };

  // Handle external course assignments
  console.log('CourseAssignmentViewer: Checking if external course:', {
    assignment_type: assignment.assignment_type,
    has_training_courses: !!assignment.training_courses,
    is_external: assignment.training_courses?.is_external,
    external_url: assignment.training_courses?.external_base_url,
    assignment_id: assignment.id,
    content_title: assignment.content_title
  });

  if (assignment.training_courses?.is_external && assignment.training_courses?.external_base_url) {
    console.log('CourseAssignmentViewer: Rendering external course:', assignment);
    console.log('CourseAssignmentViewer: External URL:', assignment.training_courses.external_base_url);
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{assignment.content_title}</h2>
                <p className="text-muted-foreground mt-2">
                  This training is hosted on an external website. Click below to access the course.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => window.open(assignment.training_courses.external_base_url, '_blank')}
                className="w-full gap-2"
                size="lg"
              >
                <ExternalLink className="h-4 w-4" />
                Open External Training
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleCompleteAssignment()}
                className="w-full"
              >
                Mark as Completed
              </Button>
            </div>
            
            {assignment.training_courses.url_parameters?.requires_certificate && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <Award className="h-4 w-4 inline mr-1" />
                  This course requires certificate upload for completion verification.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [courseProgress, setCourseProgress] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'module' | 'quiz'>('overview');
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  
  // Fetch quiz attempts for the current quiz
  const { data: quizAttempts = [] } = useQuizAttempts(
    selectedQuiz?.id, 
    user?.id
  );

  useEffect(() => {
    if (open && assignment && user?.id) {
      loadCourseData();
    }
  }, [open, assignment, user?.id]);

  const loadCourseData = async () => {
    if (!assignment?.content_id || !user?.id) return;

    setIsLoading(true);
    try {
      // Load course with modules and quizzes
      const { data: courseData, error: courseError } = await supabase
        .from('training_courses')
        .select(`
          *,
          training_modules(
            *,
            quizzes(*, quiz_questions(*))
          )
        `)
        .eq('id', assignment.content_id)
        .single();

      if (courseError) throw courseError;

      setCourse(courseData);
      const sortedModules = courseData.training_modules?.sort((a: any, b: any) => a.module_order - b.module_order) || [];
      setModules(sortedModules as CourseModule[]);

      // Load user progress for all modules
      const { data: progressData, error: progressError } = await supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', assignment.content_id);

      let mergedProgress: UserProgress[] = progressData || [];

      if (progressError && (progressError as any).code !== 'PGRST116') {
        console.error('Error loading progress:', progressError);
      }

      // Heal/augment progress using passed quiz attempts to avoid stuck "in progress"
      const quizIdToModuleId = new Map<string, string>();
      (sortedModules as any[]).forEach((m: any) => {
        (m.quizzes || []).forEach((q: any) => {
          quizIdToModuleId.set(q.id, m.id);
        });
      });

      const quizIds = Array.from(quizIdToModuleId.keys());
      if (quizIds.length > 0) {
        const { data: attempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('quiz_id, passed')
          .eq('user_id', user.id)
          .in('quiz_id', quizIds);

        if (attemptsError && (attemptsError as any).code !== 'PGRST116') {
          console.error('Error loading quiz attempts:', attemptsError);
        } else {
          const passedModuleIds = new Set(
            (attempts || [])
              .filter((a: any) => a.passed)
              .map((a: any) => quizIdToModuleId.get(a.quiz_id))
              .filter(Boolean) as string[]
          );

          const existingCompleted = new Set(
            (mergedProgress || []).filter(p => p.status === 'completed').map(p => p.module_id)
          );

          const healRecords: any[] = [];
          passedModuleIds.forEach((moduleId) => {
            if (!existingCompleted.has(moduleId!)) {
              const record: UserProgress = {
                user_id: user.id,
                course_id: assignment.content_id,
                module_id: moduleId!,
                status: 'completed',
                progress_percentage: 100,
                video_progress_percentage: 100,
                completed_at: new Date().toISOString(),
                started_at: (mergedProgress.find(p => p.module_id === moduleId)?.started_at) || new Date().toISOString(),
                last_accessed_at: new Date().toISOString(),
                organization_id: (user as any).organizationId
              } as UserProgress;

              mergedProgress = [...mergedProgress, record];
              healRecords.push(record);
            }
          });

          if (healRecords.length > 0) {
            try {
              await supabase
                .from('user_training_progress')
                .upsert(healRecords as any[], { onConflict: 'user_id,course_id,module_id' });
            } catch (e) {
              console.error('Failed to persist healed progress from quiz attempts:', e);
            }
          }
        }
      }

      setCourseProgress(mergedProgress);

      // Find current module (first incomplete one)
      const firstIncompleteIndex = sortedModules.findIndex((module: any) => {
        const moduleProgress = (mergedProgress || []).find(p => p.module_id === module.id);
        return !moduleProgress || moduleProgress.status !== 'completed';
      });
      setCurrentModuleIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);

      // If everything is complete, mark assignment as completed
      const allCompleted = (sortedModules as any[]).every((module: any) => {
        const p = (mergedProgress || []).find(mp => mp.module_id === module.id);
        return p && p.status === 'completed';
      });
      if (allCompleted) {
        try {
          await supabase
            .from('training_assignments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              completion_score: 100
            })
            .eq('id', assignment.id)
            .eq('assigned_to', user.id);

          // Refresh lists so completed items disappear from In Progress
          queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
          queryClient.invalidateQueries({ queryKey: ['user-training-progress'] });
        } catch (e) {
          console.error('Error auto-updating assignment completion:', e);
        }
      }

    } catch (error) {
      console.error('Error loading course data:', error);
      enhancedNotifications.error('Failed to load course data');
    } finally {
      setIsLoading(false);
    }
  };

  const getModuleProgress = (moduleId: string) => {
    return courseProgress.find(p => p.module_id === moduleId);
  };

  const getOverallProgress = () => {
    if (modules.length === 0) return 0;
    const completedModules = modules.filter(module => {
      const progress = getModuleProgress(module.id);
      return progress && progress.status === 'completed';
    });
    return Math.round((completedModules.length / modules.length) * 100);
  };

  const handleModuleStart = (module: CourseModule) => {
    setSelectedModule(module);
    setViewMode('module');
  };

  const handleModuleComplete = async (moduleId?: string) => {
    // Reload course progress
    await loadCourseData();
    
    // Check if all modules are completed
    const allCompleted = modules.every(module => {
      const progress = getModuleProgress(module.id);
      return progress && progress.status === 'completed';
    });

    if (allCompleted) {
      // Mark assignment as completed
      try {
        await supabase
          .from('training_assignments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            completion_score: 100
          })
          .eq('id', assignment.id)
          .eq('assigned_to', user?.id);

        // Refresh lists so completed items disappear from In Progress
        queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['user-training-progress'] });

        enhancedNotifications.success('Course completed successfully!');
        onComplete?.();
        onOpenChange(false);
      } catch (error) {
        console.error('Error updating assignment:', error);
      }
    } else if (moduleId) {
      // Move to next module only if a specific module was completed
      const nextIncompleteIndex = modules.findIndex((module, index) => {
        if (index <= currentModuleIndex) return false;
        const progress = getModuleProgress(module.id);
        return !progress || progress.status !== 'completed';
      });
      
      if (nextIncompleteIndex >= 0) {
        setCurrentModuleIndex(nextIncompleteIndex);
      }
    }
    
    setViewMode('overview');
    setSelectedModule(null);
  };

  const handleQuizStart = (quiz: any) => {
    const questions = (quiz.quiz_questions || []).map((q: any) => ({
      ...q,
      questionText: q.question_text,
      questionType: q.question_type,
      correctAnswer: q.correct_answer
    }));

    if (!questions.length) {
      enhancedNotifications.error('Quiz not ready: no questions found');
      return;
    }

    setSelectedQuiz({
      ...quiz,
      questions,
      passingScore: quiz.passing_score,
      maxAttempts: quiz.max_attempts,
      timeLimitMinutes: quiz.time_limit_minutes
    });
    setViewMode('quiz');
  };

  const handleQuizComplete = (results: any) => {
    enhancedNotifications.success(`Quiz completed! Score: ${results.score}/${results.maxScore}`);
    
    if (results.passed) {
      // Reload course data first to get updated progress
      loadCourseData().then(() => {
        // Find the next module after reloading
        const nextIncompleteIndex = modules.findIndex((module, index) => {
          if (index <= currentModuleIndex) return false;
          const progress = getModuleProgress(module.id);
          return !progress || progress.status !== 'completed';
        });
        
        if (nextIncompleteIndex >= 0) {
          setCurrentModuleIndex(nextIncompleteIndex);
          setViewMode('overview');
          enhancedNotifications.info(`Proceeding to: ${modules[nextIncompleteIndex]?.title}`);
        } else {
          // Course completed
          handleModuleComplete();
          enhancedNotifications.success('🎉 Congratulations! You have completed the entire course!');
        }
      });
    } else {
      setViewMode('overview');
      enhancedNotifications.info('You can review the material and try the quiz again when ready.');
    }
    
    setSelectedQuiz(null);
    setSelectedModule(null);
  };

  const handleQuizExit = () => {
    setViewMode('overview');
    setSelectedQuiz(null);
  };

  const handleRetakeQuiz = () => {
    // Simply restart the quiz with the same quiz data
    setViewMode('quiz');
  };

  const renderOverview = () => {
    const overallProgress = getOverallProgress();
    
    return (
      <div className="space-y-6">
        {/* Course Header */}
        <div className="text-center space-y-4">
          <div className="p-3 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 w-fit mx-auto">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{course?.title}</h2>
            <p className="text-muted-foreground mt-2">{course?.description}</p>
          </div>
          
          {/* Course Progress */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Course Progress</span>
              <span className="text-sm text-muted-foreground">{overallProgress}% Complete</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </div>

        <Separator />

        {/* Modules List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Course Modules</h3>
          <div className="space-y-3">
            {modules.map((module, index) => {
              const progress = getModuleProgress(module.id);
              const isCompleted = progress && progress.status === 'completed';
              const isCurrentModule = index === currentModuleIndex;
              
              return (
                <Card 
                  key={module.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isCurrentModule ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleModuleStart(module)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isCompleted 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : module.content_type === 'video' || module.content_type === 'mixed' ? (
                            <Video className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{module.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Module {index + 1} • 
                            {module.content_type === 'mixed' ? ' Video + Text' : 
                             module.content_type === 'video' ? ' Video Content' : ' Text Content'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {progress && (
                          <Badge variant={isCompleted ? "default" : "secondary"}>
                            {isCompleted ? 'Completed' : `${progress.progress_percentage}%`}
                          </Badge>
                        )}
                        <Button size="sm" variant={isCompleted ? "outline" : "default"}>
                          {isCompleted ? 'Review' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderModuleView = () => {
    if (!selectedModule) return null;

    const quiz = selectedModule.quizzes?.[0];
    const hasVideo = selectedModule.content_type === 'video' || selectedModule.content_type === 'mixed';

    // Transform module to match expected interface
    const transformedModule = {
      ...selectedModule,
      content: selectedModule.text_content || selectedModule.content,
      content_type: selectedModule.content_type as 'text' | 'video' | 'mixed',
      description: selectedModule.description || ''
    };

    if (hasVideo) {
      return (
        <VideoToQuizFlow
          module={transformedModule}
          quiz={quiz}
          onQuizStart={() => quiz && handleQuizStart(quiz)}
          onModuleComplete={() => handleModuleComplete(selectedModule.id)}
        />
      );
    } else {
      return (
        <ModuleViewer
          open={true}
          onOpenChange={() => setViewMode('overview')}
          module={transformedModule}
          quiz={quiz}
          courseTitle={course?.title || ''}
          onQuizStart={() => quiz && handleQuizStart(quiz)}
          onModuleComplete={() => handleModuleComplete(selectedModule.id)}
        />
      );
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading course...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open && viewMode === 'overview'} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              Course Assignment
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            {renderOverview()}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Module Viewer Dialog */}
      {viewMode === 'module' && selectedModule && !selectedModule.youtube_video_id && (
        renderModuleView()
      )}

      {/* Video Flow for video modules */}
      {viewMode === 'module' && selectedModule?.youtube_video_id && (
        <Dialog open={true} onOpenChange={() => setViewMode('overview')}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('overview')}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedModule.title}
              </DialogTitle>
            </DialogHeader>
            {renderModuleView()}
          </DialogContent>
        </Dialog>
      )}

      {/* Quiz Taker Dialog */}
      {viewMode === 'quiz' && selectedQuiz && (
        <Dialog open={true} onOpenChange={() => setViewMode('overview')}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Take Quiz</DialogTitle>
            </DialogHeader>
            <QuizTaker
              quiz={selectedQuiz}
              onComplete={handleQuizComplete}
              onExit={handleQuizExit}
              currentAttempts={quizAttempts.length}
              hasNextModule={currentModuleIndex < modules.length - 1}
              onRetakeQuiz={handleRetakeQuiz}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CourseAssignmentViewer;