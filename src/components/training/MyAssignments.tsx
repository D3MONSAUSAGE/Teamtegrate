import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  PenTool, 
  Clock, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  User,
  Target
} from 'lucide-react';
import { useTrainingAssignments, useUpdateAssignmentStatus } from '@/hooks/useTrainingData';
import { format, isAfter, parseISO } from 'date-fns';
import QuizTaker from './QuizTaker';
import { useQuizzes } from '@/hooks/useTrainingData';

interface MyAssignmentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MyAssignments: React.FC<MyAssignmentsProps> = ({ open, onOpenChange }) => {
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [isQuizTakerOpen, setIsQuizTakerOpen] = useState(false);
  
  const { data: assignments = [], isLoading } = useTrainingAssignments();
  const { data: allQuizzes = [] } = useQuizzes();
  const updateStatus = useUpdateAssignmentStatus();

  // Filter assignments by status
  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const inProgressAssignments = assignments.filter(a => a.status === 'in_progress');
  const completedAssignments = assignments.filter(a => a.status === 'completed');
  const overdueAssignments = assignments.filter(a => 
    a.status !== 'completed' && a.due_date && isAfter(new Date(), parseISO(a.due_date))
  );

  const handleStartAssignment = async (assignment: any) => {
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
    }
  };

  const handleQuizComplete = (results: any) => {
    setIsQuizTakerOpen(false);
    setSelectedQuiz(null);
    // Assignment status will be updated automatically by the quiz submission
  };

  const handleQuizExit = () => {
    setIsQuizTakerOpen(false);
    setSelectedQuiz(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const renderAssignment = (assignment: any) => {
    const isOverdue = assignment.due_date && isAfter(new Date(), parseISO(assignment.due_date)) && assignment.status !== 'completed';
    const displayStatus = isOverdue ? 'overdue' : assignment.status;

    return (
      <Card key={assignment.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  {assignment.assignment_type === 'course' ? (
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  ) : (
                    <PenTool className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{assignment.content_title}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {assignment.assignment_type} • Assigned by {assignment.assigned_by_user?.name || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={getStatusColor(displayStatus)}>
                  {displayStatus === 'overdue' ? 'Overdue' : displayStatus.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(assignment.priority)}>
                  {assignment.priority} priority
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Assigned: {format(parseISO(assignment.assigned_at), 'MMM d, yyyy')}
              </div>
              {assignment.due_date && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Due: {format(parseISO(assignment.due_date), 'MMM d, yyyy')}
                </div>
              )}
              {assignment.completion_score != null && (
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Score: {assignment.completion_score}%
                </div>
              )}
            </div>

            {assignment.status === 'pending' && (
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => handleStartAssignment(assignment)}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start {assignment.assignment_type}
                </Button>
              </div>
            )}

            {assignment.status === 'in_progress' && assignment.assignment_type === 'quiz' && (
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleStartAssignment(assignment)}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Continue Quiz
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              My Training Assignments
            </DialogTitle>
          </DialogHeader>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingAssignments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {pendingAssignments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="relative">
                In Progress
                {inProgressAssignments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {inProgressAssignments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="relative">
                Completed
                {completedAssignments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {completedAssignments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="overdue" className="relative">
                Overdue
                {overdueAssignments.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {overdueAssignments.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {pendingAssignments.length > 0 ? (
                    pendingAssignments.map(renderAssignment)
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending assignments</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="in-progress" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {inProgressAssignments.length > 0 ? (
                    inProgressAssignments.map(renderAssignment)
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No assignments in progress</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {completedAssignments.length > 0 ? (
                    completedAssignments.map(renderAssignment)
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No completed assignments</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="overdue" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {overdueAssignments.length > 0 ? (
                    overdueAssignments.map(renderAssignment)
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No overdue assignments</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Quiz Taker Dialog */}
      {selectedQuiz && (
        <Dialog open={isQuizTakerOpen} onOpenChange={setIsQuizTakerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Take Quiz</DialogTitle>
            </DialogHeader>
            <QuizTaker
              quiz={selectedQuiz}
              onComplete={handleQuizComplete}
              onExit={handleQuizExit}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MyAssignments;