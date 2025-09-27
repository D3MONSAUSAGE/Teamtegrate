import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2, GraduationCap, Settings, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import MyTrainingTab from '@/components/training/MyTrainingTab';
import TrainingManagementTab from '@/components/training/TrainingManagementTab';
import { VideoLibrary } from '@/components/training/video-library/VideoLibrary';
import { VideoLibraryManager } from '@/components/training/video-library/VideoLibraryManager';
// Add back required imports for dialogs and functionality
import QuizCreator from '@/components/training/QuizCreator';
import CourseCreator from '@/components/training/CourseCreator';
import CourseEditor from '@/components/training/CourseEditor';
import QuizEditor from '@/components/training/QuizEditor';
import QuizResults from '@/components/training/QuizResults';
import UserAssignment from '@/components/training/UserAssignment';
import MyAssignments from '@/components/training/MyAssignments';
import EmployeeProgressDashboard from '@/components/training/EmployeeProgressDashboard';
import RetrainingSettings from '@/components/training/RetrainingSettings';
import { NewEmployeeWizard } from '@/components/onboarding/wizard/NewEmployeeWizard';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMyOnboarding } from '@/hooks/onboarding/useOnboardingInstances';
import { useDemoOnboarding } from '@/hooks/onboarding/useDemoOnboarding';
import { useTrainingCourses, useQuizzes, useTrainingAssignments, useUpdateAssignmentStatus } from '@/hooks/useTrainingData';
import QuizTaker from '@/components/training/QuizTaker';
import QuizTakerWrapper from '@/components/training/QuizTakerWrapper';
import CourseAssignmentViewer from '@/components/training/CourseAssignmentViewer';
import { useQueryClient } from '@tanstack/react-query';
import CertificateReviewDashboard from '@/components/training/CertificateReviewDashboard';
import TrainingErrorBoundary from '@/components/training/TrainingErrorBoundary';

const TrainingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to training dashboard if directly accessing /dashboard/training
  useEffect(() => {
    if (location.pathname === '/dashboard/training') {
      navigate('/dashboard/training/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);
  const [isQuizCreatorOpen, setIsQuizCreatorOpen] = useState(false);
  const [isCourseCreatorOpen, setIsCourseCreatorOpen] = useState(false);
  const [isCourseEditorOpen, setIsCourseEditorOpen] = useState(false);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [isQuizResultsOpen, setIsQuizResultsOpen] = useState(false);
  const [isUserAssignmentOpen, setIsUserAssignmentOpen] = useState(false);
  const [isMyAssignmentsOpen, setIsMyAssignmentsOpen] = useState(false);
  const [isEmployeeProgressOpen, setIsEmployeeProgressOpen] = useState(false);
  const [isOnboardingWizardOpen, setIsOnboardingWizardOpen] = useState(false);
  const [isRetrainingSettingsOpen, setIsRetrainingSettingsOpen] = useState(false);
  const [isCertificateReviewOpen, setIsCertificateReviewOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isQuizTakerOpen, setIsQuizTakerOpen] = useState(false);
  const [isCourseViewerOpen, setIsCourseViewerOpen] = useState(false);
  const [selectedCourseAssignment, setSelectedCourseAssignment] = useState<any>(null);
  
  const { data: courses = [], isLoading: coursesLoading } = useTrainingCourses();
  const { data: allQuizzes = [], isLoading: quizzesLoading } = useQuizzes();
  const { data: assignments = [] } = useTrainingAssignments();
  const { data: onboardingInstance } = useMyOnboarding();
  const { createDemo, isCreating } = useDemoOnboarding();
  const updateStatus = useUpdateAssignmentStatus();
  const queryClient = useQueryClient();

  console.log('TrainingPage: Current user:', user?.id, user?.email, user?.role);
  console.log('TrainingPage: Assignments from hook:', assignments.length, assignments);
  console.log('TrainingPage: Assignment breakdown:', {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    in_progress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    courses: assignments.filter(a => a.assignment_type === 'course').length,
    quizzes: assignments.filter(a => a.assignment_type === 'quiz').length,
    external_courses: assignments.filter(a => 
      a.assignment_type === 'course' && 
      (a as any).training_courses?.is_external
    ).length
  });
  console.log('TrainingPage: Detailed assignment info:', assignments.map(a => ({
    id: a.id,
    title: a.content_title,
    type: a.assignment_type,
    status: a.status,
    priority: a.priority,
    has_course_data: !!(a as any).training_courses,
    is_external: a.assignment_type === 'course' ? !!(a as any).training_courses?.is_external : false,
    external_url: a.assignment_type === 'course' ? (a as any).training_courses?.external_base_url : null
  })));
  console.log('TrainingPage: Assignment statuses:', assignments.map(a => ({
    id: a.id,
    title: a.content_title,
    status: a.status,
    type: a.assignment_type
  })));

  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-emerald-600" />
              <div className="absolute inset-0 h-16 w-16 mx-auto rounded-full bg-emerald-600/20 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Loading Training Center</h3>
            <p className="text-muted-foreground">Please wait while we load your training dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user exists
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access the training center.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const handleCreateCourse = () => {
    setIsCourseCreatorOpen(true);
  };

  const handleCreateQuiz = () => {
    setIsQuizCreatorOpen(true);
  };

  const handleViewResults = (quiz: any) => {
    setSelectedQuiz(quiz);
    setIsQuizResultsOpen(true);
  };

  const handleAssignContent = () => {
    setIsUserAssignmentOpen(true);
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setIsCourseEditorOpen(true);
  };

  const handleEditQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    setIsQuizEditorOpen(true);
  };

  const handleViewAssignment = async (assignment: any) => {
    if (assignment.assignment_type === 'quiz') {
      // Find the quiz data
      const quiz = allQuizzes.find(q => q.id === assignment.content_id);
      if (quiz) {
        // Transform quiz data to match QuizTaker interface
        const transformedQuiz = {
          ...quiz,
          questions: (quiz.quiz_questions || []).map((q: any) => ({
            ...q,
            questionText: q.question_text,
            questionType: q.question_type,
            correctAnswer: q.correct_answer
          })),
          passingScore: quiz.passing_score,
          maxAttempts: quiz.max_attempts,
          timeLimitMinutes: quiz.time_limit_minutes
        };
        setSelectedQuiz(transformedQuiz);
        setIsQuizTakerOpen(true);
        
        // Update assignment status to in_progress
        if (assignment.status === 'pending') {
          await updateStatus.mutateAsync({
            assignmentId: assignment.id,
            status: 'in_progress',
            startedAt: new Date().toISOString()
          });
        }
      }
    } else if (assignment.assignment_type === 'course') {
      // Handle course assignments
      setSelectedCourseAssignment(assignment);
      setIsCourseViewerOpen(true);
      
      // Update assignment status to in_progress
      if (assignment.status === 'pending') {
        await updateStatus.mutateAsync({
          assignmentId: assignment.id,
          status: 'in_progress',
          startedAt: new Date().toISOString()
        });
      }
    }
  };

  const handleStartOnboarding = () => {
    setIsOnboardingWizardOpen(true);
  };

  const handleQuizComplete = () => {
    setIsQuizTakerOpen(false);
    setSelectedQuiz(null);
    // Refresh assignments to reflect completion
    queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
  };

  const handleQuizExit = () => {
    setIsQuizTakerOpen(false);
    setSelectedQuiz(null);
  };

  const handleCourseComplete = () => {
    setIsCourseViewerOpen(false);
    setSelectedCourseAssignment(null);
    // Refresh assignments to reflect completion
    queryClient.invalidateQueries({ queryKey: ['training-assignments'] });
  };

  const handleCourseExit = () => {
    setIsCourseViewerOpen(false);
    setSelectedCourseAssignment(null);
  };

  return (
    <TrainingErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Tabs defaultValue="my-training" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
            <TabsTrigger value="my-training" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              My Training
            </TabsTrigger>
            <TabsTrigger value="video-library" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video Library
            </TabsTrigger>
            {canManageContent && (
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Management
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="my-training" className="space-y-8">
            <MyTrainingTab
              assignments={assignments}
              onViewAssignment={handleViewAssignment}
              onViewAllAssignments={() => setIsMyAssignmentsOpen(true)}
            />
          </TabsContent>

          <TabsContent value="video-library" className="space-y-8">
            <VideoLibrary />
          </TabsContent>

          {canManageContent && (
            <TabsContent value="management" className="space-y-8">
              <Tabs defaultValue="content" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="content">Training Content</TabsTrigger>
                  <TabsTrigger value="video-library">Video Library</TabsTrigger>
                </TabsList>

                <TabsContent value="content">
                  <TrainingManagementTab
                    courses={courses}
                    quizzes={allQuizzes}
                    coursesLoading={coursesLoading}
                    quizzesLoading={quizzesLoading}
                    canManageContent={canManageContent}
                    onCreateCourse={handleCreateCourse}
                    onCreateQuiz={handleCreateQuiz}
                    onEditCourse={handleEditCourse}
                    onEditQuiz={handleEditQuiz}
                    onViewResults={handleViewResults}
                    onAssignContent={handleAssignContent}
                    onViewAnalytics={() => setIsEmployeeProgressOpen(true)}
                    onRetrainingSettings={() => setIsRetrainingSettingsOpen(true)}
                    onCertificateReview={() => setIsCertificateReviewOpen(true)}
                  />
                </TabsContent>

                <TabsContent value="video-library">
                  <VideoLibraryManager />
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      <QuizCreator 
        open={isQuizCreatorOpen}
        onOpenChange={setIsQuizCreatorOpen}
      />
      
      <CourseCreator 
        open={isCourseCreatorOpen}
        onOpenChange={setIsCourseCreatorOpen}
      />
      
      <CourseEditor 
        open={isCourseEditorOpen}
        onOpenChange={setIsCourseEditorOpen}
        course={selectedCourse}
      />
      
      <QuizEditor 
        open={isQuizEditorOpen}
        onOpenChange={setIsQuizEditorOpen}
        quiz={selectedQuiz}
      />
      
      <QuizResults 
        open={isQuizResultsOpen}
        onOpenChange={setIsQuizResultsOpen}
        quizId={selectedQuiz?.id}
        quizTitle={selectedQuiz?.title}
      />
      
      <UserAssignment 
        open={isUserAssignmentOpen}
        onOpenChange={setIsUserAssignmentOpen}
      />
      
      <MyAssignments 
        open={isMyAssignmentsOpen}
        onOpenChange={setIsMyAssignmentsOpen}
      />

       <EmployeeProgressDashboard
         open={isEmployeeProgressOpen}
         onOpenChange={setIsEmployeeProgressOpen}
       />

       {/* Onboarding Wizard Dialog */}
        <Dialog open={isOnboardingWizardOpen} onOpenChange={setIsOnboardingWizardOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            <NewEmployeeWizard onClose={() => setIsOnboardingWizardOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* Retraining Settings Dialog */}
        <RetrainingSettings 
          open={isRetrainingSettingsOpen}
          onOpenChange={setIsRetrainingSettingsOpen}
        />

        {/* Quiz Taker Dialog */}
        {selectedQuiz && (
          <Dialog open={isQuizTakerOpen} onOpenChange={setIsQuizTakerOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <QuizTakerWrapper
                quiz={selectedQuiz}
                onComplete={handleQuizComplete}
                onExit={handleQuizExit}
                currentAttempts={0}
                hasNextModule={false}
                onRetakeQuiz={() => setIsQuizTakerOpen(true)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Course Assignment Viewer */}
        {selectedCourseAssignment && (
          <CourseAssignmentViewer
            open={isCourseViewerOpen}
            onOpenChange={setIsCourseViewerOpen}
            assignment={selectedCourseAssignment}
            onComplete={handleCourseComplete}
          />
        )}


        {/* Certificate Review Dashboard */}
         <CertificateReviewDashboard 
           open={isCertificateReviewOpen}
           onOpenChange={setIsCertificateReviewOpen}
         />
       </div>
     </TrainingErrorBoundary>
   );
 };

export default TrainingPage;