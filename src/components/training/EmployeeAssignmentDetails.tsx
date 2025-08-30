import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Brain, 
  Calendar, 
  CheckCircle, 
  Clock, 
  User,
  Eye,
  Download,
  Trophy,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useTrainingAssignments, useQuizResultsWithNames } from '@/hooks/useTrainingData';
import { format } from 'date-fns';
import QuizAttemptViewer from './QuizAttemptViewer';

interface EmployeeAssignmentDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
}

const EmployeeAssignmentDetails: React.FC<EmployeeAssignmentDetailsProps> = ({ 
  open, 
  onOpenChange, 
  employee 
}) => {
  const [selectedTab, setSelectedTab] = useState('assignments');
  const [selectedQuizAttempt, setSelectedQuizAttempt] = useState<any>(null);
  const [quizAttemptViewerOpen, setQuizAttemptViewerOpen] = useState(false);
  
  const { data: assignments = [], isLoading } = useTrainingAssignments(employee?.id);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const courseAssignments = assignments.filter(a => a.assignment_type === 'course');
  const quizAssignments = assignments.filter(a => a.assignment_type === 'quiz');

  const exportAssignmentData = () => {
    const csvData = assignments.map(assignment => ({
      'Type': assignment.assignment_type,
      'Content ID': assignment.content_id,
      'Status': assignment.status,
      'Assigned Date': format(new Date(assignment.assigned_at), 'yyyy-MM-dd'),
      'Due Date': assignment.due_date ? format(new Date(assignment.due_date), 'yyyy-MM-dd') : 'No due date',
      'Completed Date': assignment.completed_at ? format(new Date(assignment.completed_at), 'yyyy-MM-dd') : 'Not completed',
      'Completion Score': assignment.completion_score || 'N/A',
      'Assigned By': assignment.assigned_by || 'System'
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employee?.name}-assignments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewQuizDetails = (assignment: any) => {
    setSelectedQuizAttempt({
      quizId: assignment.content_id,
      employeeName: employee?.name,
      assignment
    });
    setQuizAttemptViewerOpen(true);
  };

  if (!employee) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    Assignment Details: {employee.name}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">{employee.email} • {employee.role}</p>
                </div>
              </div>
              <Button onClick={exportAssignmentData} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </DialogHeader>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="assignments">All Assignments ({assignments.length})</TabsTrigger>
              <TabsTrigger value="courses">Courses ({courseAssignments.length})</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes ({quizAssignments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="assignments" className="space-y-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              {assignment.assignment_type === 'course' ? 
                                <BookOpen className="h-4 w-4 text-blue-600" /> : 
                                <Brain className="h-4 w-4 text-purple-600" />
                              }
                            </div>
                            <div>
                              <p className="font-medium">{assignment.assignment_type === 'course' ? 'Course' : 'Quiz'}</p>
                              <p className="text-sm text-muted-foreground">ID: {assignment.content_id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(assignment.status)}>
                              {getStatusIcon(assignment.status)}
                              {assignment.status}
                            </Badge>
                            {assignment.assignment_type === 'quiz' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewQuizDetails(assignment)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Assigned:</span>
                            <p className="font-medium">{format(new Date(assignment.assigned_at), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due Date:</span>
                            <p className="font-medium">
                              {assignment.due_date ? format(new Date(assignment.due_date), 'MMM d, yyyy') : 'No due date'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Completed:</span>
                            <p className="font-medium">
                              {assignment.completed_at ? format(new Date(assignment.completed_at), 'MMM d, yyyy') : 'Not completed'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Score:</span>
                            <p className="font-medium">
                              {assignment.completion_score ? `${assignment.completion_score}%` : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {assignment.status === 'completed' && assignment.completion_score && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Completion Score</span>
                              <span>{assignment.completion_score}%</span>
                            </div>
                            <Progress value={assignment.completion_score} className="h-2" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {courseAssignments.map((assignment) => (
                    <Card key={assignment.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Course Assignment</p>
                              <p className="text-sm text-muted-foreground">Course ID: {assignment.content_id}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={getStatusColor(assignment.status)}>
                            {getStatusIcon(assignment.status)}
                            {assignment.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Assigned:</span>
                            <p className="font-medium">{format(new Date(assignment.assigned_at), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due Date:</span>
                            <p className="font-medium">
                              {assignment.due_date ? format(new Date(assignment.due_date), 'MMM d, yyyy') : 'No due date'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Progress:</span>
                            <p className="font-medium">{assignment.status === 'completed' ? '100%' : '0%'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {courseAssignments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No course assignments found for this employee.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {quizAssignments.map((assignment) => (
                    <Card key={assignment.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100">
                              <Brain className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">Quiz Assignment</p>
                              <p className="text-sm text-muted-foreground">Quiz ID: {assignment.content_id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(assignment.status)}>
                              {getStatusIcon(assignment.status)}
                              {assignment.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewQuizDetails(assignment)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Attempts
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Assigned:</span>
                            <p className="font-medium">{format(new Date(assignment.assigned_at), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due Date:</span>
                            <p className="font-medium">
                              {assignment.due_date ? format(new Date(assignment.due_date), 'MMM d, yyyy') : 'No due date'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Best Score:</span>
                            <p className="font-medium">
                              {assignment.completion_score ? `${assignment.completion_score}%` : 'Not attempted'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <p className="font-medium flex items-center gap-1">
                              {assignment.completion_score && assignment.completion_score >= 70 ? (
                                <><Trophy className="h-3 w-3 text-yellow-600" /> Passed</>
                              ) : assignment.completion_score ? (
                                <><XCircle className="h-3 w-3 text-red-600" /> Failed</>
                              ) : (
                                <><Clock className="h-3 w-3 text-gray-600" /> Pending</>
                              )}
                            </p>
                          </div>
                        </div>

                        {assignment.completion_score && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Best Score</span>
                              <span>{assignment.completion_score}%</span>
                            </div>
                            <Progress 
                              value={assignment.completion_score} 
                              className={`h-2 ${assignment.completion_score >= 70 ? 'text-green-600' : 'text-red-600'}`} 
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {quizAssignments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No quiz assignments found for this employee.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <QuizAttemptViewer
        open={quizAttemptViewerOpen}
        onOpenChange={setQuizAttemptViewerOpen}
        quizData={selectedQuizAttempt}
      />
    </>
  );
};

export default EmployeeAssignmentDetails;