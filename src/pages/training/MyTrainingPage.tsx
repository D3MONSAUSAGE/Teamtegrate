import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingAssignments, useQuizzes, useUpdateAssignmentStatus } from '@/hooks/useTrainingData';
import { useQueryClient } from '@tanstack/react-query';
import MyTrainingTab from '@/components/training/MyTrainingTab';
import MyAssignments from '@/components/training/MyAssignments';
import QuizTakerWrapper from '@/components/training/QuizTakerWrapper';
import CourseAssignmentViewer from '@/components/training/CourseAssignmentViewer';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TrainingBreadcrumb } from '@/components/training/navigation/TrainingBreadcrumb';
import TrainingErrorBoundary from '@/components/training/TrainingErrorBoundary';

export function MyTrainingPage() {
  const { user } = useAuth();
  const { data: assignments = [] } = useTrainingAssignments();
  const { data: allQuizzes = [] } = useQuizzes();
  const updateStatus = useUpdateAssignmentStatus();
  const queryClient = useQueryClient();

  const [isMyAssignmentsOpen, setIsMyAssignmentsOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [isQuizTakerOpen, setIsQuizTakerOpen] = useState(false);
  const [isCourseViewerOpen, setIsCourseViewerOpen] = useState(false);
  const [selectedCourseAssignment, setSelectedCourseAssignment] = useState<any>(null);

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
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <TrainingBreadcrumb 
            items={[
              { label: 'Training', href: '/dashboard/training' },
              { label: 'My Training', href: '/dashboard/training/my-training' }
            ]} 
          />

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Training</h1>
            <p className="text-muted-foreground">
              View and complete your assigned training courses and assessments.
            </p>
          </div>

          <MyTrainingTab
            assignments={assignments}
            onViewAssignment={handleViewAssignment}
            onViewAllAssignments={() => setIsMyAssignmentsOpen(true)}
          />
        </div>

        {/* Dialogs */}
        <MyAssignments 
          open={isMyAssignmentsOpen}
          onOpenChange={setIsMyAssignmentsOpen}
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
      </div>
    </TrainingErrorBoundary>
  );
}