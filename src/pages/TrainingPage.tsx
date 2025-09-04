import React, { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2, GraduationCap, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LearningDashboard from '@/components/training/LearningDashboard';
import ContentGrid from '@/components/training/ContentGrid';
import ManagementPanel from '@/components/training/ManagementPanel';
import TrainingStatsCards from '@/components/training/TrainingStatsCards';
import QuizCreator from '@/components/training/QuizCreator';
import CourseCreator from '@/components/training/CourseCreator';
import CourseEditor from '@/components/training/CourseEditor';
import QuizEditor from '@/components/training/QuizEditor';
import QuizResults from '@/components/training/QuizResults';
import UserAssignment from '@/components/training/UserAssignment';
import MyAssignments from '@/components/training/MyAssignments';
import EmployeeProgressDashboard from '@/components/training/EmployeeProgressDashboard';
import RetrainingSettings from '@/components/training/RetrainingSettings';
import { OnboardingDashboard } from '@/components/training/OnboardingDashboard';
import { NewEmployeeWizard } from '@/components/onboarding/wizard/NewEmployeeWizard';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMyOnboarding } from '@/hooks/onboarding/useOnboardingInstances';
import { useDemoOnboarding } from '@/hooks/onboarding/useDemoOnboarding';
import { useTrainingCourses, useQuizzes, useTrainingAssignments, useUpdateAssignmentStatus, useQuizAttempts } from '@/hooks/useTrainingData';
import QuizTaker from '@/components/training/QuizTaker';
import CourseAssignmentViewer from '@/components/training/CourseAssignmentViewer';
import { useQueryClient } from '@tanstack/react-query';
import TrainingReassignmentManager from '@/components/training/TrainingReassignmentManager';
import ComplianceRetrainingManager from '@/components/training/ComplianceRetrainingManager';

const TrainingPage = () => {
  const { user, loading } = useAuth();
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
  const [isReassignmentManagerOpen, setIsReassignmentManagerOpen] = useState(false);
  const [isComplianceManagerOpen, setIsComplianceManagerOpen] = useState(false);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="training" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="training" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Onboarding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="space-y-8">
            {/* Main Dashboard - Role-Based Layout */}
            <div className="space-y-8">
              
              {/* Learning Dashboard - Always First for Regular Users */}
              {!canManageContent && (
                <div className="animate-fade-in">
                  <LearningDashboard
                    assignments={assignments}
                    onViewAssignment={handleViewAssignment}
                    onViewAllAssignments={() => setIsMyAssignmentsOpen(true)}
                  />
                </div>
              )}

              {/* Onboarding Panel - Available for All Users */}
              {!canManageContent && (
                <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                   <ManagementPanel
                     onCreateCourse={() => {}}
                     onCreateQuiz={() => {}}
                     onAssignContent={() => {}}
                     onViewAnalytics={() => {}}
                     onStartOnboarding={handleStartOnboarding}
                     userRole={user.role}
                     showOnlyOnboarding={true}
                   />
                </div>
              )}

              {/* Management Panel - First for Managers/Admins */}
               {canManageContent && (
                 <div className="animate-fade-in">
                    <ManagementPanel
                      onCreateCourse={handleCreateCourse}
                      onCreateQuiz={handleCreateQuiz}
                      onAssignContent={handleAssignContent}
                      onViewAnalytics={() => setIsEmployeeProgressOpen(true)}
                      onStartOnboarding={handleStartOnboarding}
                       onRetrainingSettings={() => setIsRetrainingSettingsOpen(true)}
                       onManageAssignments={() => setIsReassignmentManagerOpen(true)}
                       onManageCompliance={() => setIsComplianceManagerOpen(true)}
                       userRole={user.role}
                    />
                 </div>
               )}

              {/* Your Assigned Training - For Management Users */}
              {canManageContent && assignments.length > 0 && (
                <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Your Assigned Training
                    </h3>
                    <LearningDashboard
                      assignments={assignments}
                      onViewAssignment={handleViewAssignment}
                      onViewAllAssignments={() => setIsMyAssignmentsOpen(true)}
                    />
                  </div>
                </div>
              )}

              {/* Quick Stats - Compact for All Users */}
              <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <TrainingStatsCards />
              </div>

              {/* Content Grid - Improved Layout */}
              <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                <ContentGrid
                  courses={courses}
                  quizzes={allQuizzes}
                  coursesLoading={coursesLoading}
                  quizzesLoading={quizzesLoading}
                  canManageContent={canManageContent}
                  onEditCourse={handleEditCourse}
                  onEditQuiz={handleEditQuiz}
                  onViewResults={handleViewResults}
                />
              </div>

              {/* My Assignments - For Regular Users Lower Priority */}
              {!canManageContent && assignments.length > 0 && (
                <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                  <div className="text-center">
                    <button 
                      onClick={() => setIsMyAssignmentsOpen(true)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      View all {assignments.length} assignments →
                    </button>
                  </div>
                </div>
              )}

            </div>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-8">
            <OnboardingDashboard />
          </TabsContent>
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
              <QuizTaker
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

        {/* Training Reassignment Manager */}
        <TrainingReassignmentManager 
          open={isReassignmentManagerOpen}
          onOpenChange={setIsReassignmentManagerOpen}
        />

        {/* Compliance Retraining Manager */}
        <ComplianceRetrainingManager 
          open={isComplianceManagerOpen}
          onOpenChange={setIsComplianceManagerOpen}
        />
    </div>
  );
};

export default TrainingPage;