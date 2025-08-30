import React, { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, GraduationCap } from 'lucide-react';
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
import { useTrainingCourses, useQuizzes, useTrainingAssignments } from '@/hooks/useTrainingData';

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
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  
  const { data: courses = [], isLoading: coursesLoading } = useTrainingCourses();
  const { data: allQuizzes = [], isLoading: quizzesLoading } = useQuizzes();
  const { data: assignments = [] } = useTrainingAssignments();

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

  const handleViewAssignment = (assignment: any) => {
    // Navigate to assignment or open in modal
    console.log('Viewing assignment:', assignment);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
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

          {/* Management Panel - First for Managers/Admins */}
          {canManageContent && (
            <div className="animate-fade-in">
              <ManagementPanel
                onCreateCourse={handleCreateCourse}
                onCreateQuiz={handleCreateQuiz}
                onAssignContent={handleAssignContent}
                onViewAnalytics={() => setIsEmployeeProgressOpen(true)}
                userRole={user.role}
              />
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
    </div>
  );
};

export default TrainingPage;