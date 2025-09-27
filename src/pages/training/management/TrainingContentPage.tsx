import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingCourses, useQuizzes } from '@/hooks/useTrainingData';
import TrainingManagementTab from '@/components/training/TrainingManagementTab';
import QuizCreator from '@/components/training/QuizCreator';
import CourseCreator from '@/components/training/CourseCreator';
import CourseEditor from '@/components/training/CourseEditor';
import QuizEditor from '@/components/training/QuizEditor';
import QuizResults from '@/components/training/QuizResults';
import { TrainingBreadcrumb } from '@/components/training/navigation/TrainingBreadcrumb';
import TrainingErrorBoundary from '@/components/training/TrainingErrorBoundary';

export function TrainingContentPage() {
  const { user } = useAuth();
  const { data: courses = [], isLoading: coursesLoading } = useTrainingCourses();
  const { data: allQuizzes = [], isLoading: quizzesLoading } = useQuizzes();

  const [isQuizCreatorOpen, setIsQuizCreatorOpen] = useState(false);
  const [isCourseCreatorOpen, setIsCourseCreatorOpen] = useState(false);
  const [isCourseEditorOpen, setIsCourseEditorOpen] = useState(false);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [isQuizResultsOpen, setIsQuizResultsOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  if (!canManageContent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Access Restricted</h2>
            <p className="text-muted-foreground">You don't have permission to manage training content.</p>
          </div>
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

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setIsCourseEditorOpen(true);
  };

  const handleEditQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    setIsQuizEditorOpen(true);
  };

  return (
    <TrainingErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <TrainingBreadcrumb 
            items={[
              { label: 'Training', href: '/dashboard/training' },
              { label: 'Management', href: '/dashboard/training/management' },
              { label: 'Content', href: '/dashboard/training/management/content' }
            ]} 
          />

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Training Content Management</h1>
            <p className="text-muted-foreground">
              Create, edit, and manage training courses and quizzes for your organization.
            </p>
          </div>

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
            onAssignContent={() => {}} // This will be handled by assignments page
            onViewAnalytics={() => {}} // This will be handled by analytics page
            onRetrainingSettings={() => {}} // This will be handled by retraining page
            onCertificateReview={() => {}} // This will be handled by certificates page
          />
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
      </div>
    </TrainingErrorBoundary>
  );
}