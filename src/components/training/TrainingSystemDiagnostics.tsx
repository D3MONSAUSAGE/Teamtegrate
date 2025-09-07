import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingCourses, useQuizzes, useTrainingAssignments } from '@/hooks/useTrainingData';
import { useQuizQuestions } from '@/hooks/useQuizQuestions';

interface TrainingSystemDiagnosticsProps {
  onClose?: () => void;
}

const TrainingSystemDiagnostics: React.FC<TrainingSystemDiagnosticsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useTrainingCourses();
  const { data: quizzes = [], isLoading: quizzesLoading, error: quizzesError } = useQuizzes();
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError } = useTrainingAssignments();
  
  // Test a sample quiz questions fetch
  const sampleQuizId = quizzes[0]?.id;
  const { data: sampleQuestions, isLoading: questionsLoading, error: questionsError } = useQuizQuestions(sampleQuizId);

  const diagnosticItems = [
    {
      name: 'User Authentication',
      status: user ? 'success' : 'error',
      message: user ? `Authenticated as ${user.name} (${user.role})` : 'Not authenticated',
      details: user ? `Organization: ${user.organizationId || 'Not set'}` : null
    },
    {
      name: 'Training Courses',
      status: coursesError ? 'error' : coursesLoading ? 'loading' : courses.length > 0 ? 'success' : 'warning',
      message: coursesError 
        ? `Error: ${coursesError.message}` 
        : coursesLoading 
          ? 'Loading...' 
          : `${courses.length} courses found`,
      details: !coursesLoading && courses.length > 0 ? `Latest: ${courses[0]?.title}` : null
    },
    {
      name: 'Quiz System',
      status: quizzesError ? 'error' : quizzesLoading ? 'loading' : quizzes.length > 0 ? 'success' : 'warning',
      message: quizzesError 
        ? `Error: ${quizzesError.message}` 
        : quizzesLoading 
          ? 'Loading...' 
          : `${quizzes.length} quizzes found`,
      details: !quizzesLoading && quizzes.length > 0 ? `Latest: ${quizzes[0]?.title}` : null
    },
    {
      name: 'Quiz Questions',
      status: questionsError ? 'error' : questionsLoading ? 'loading' : sampleQuestions && sampleQuestions.length > 0 ? 'success' : 'warning',
      message: questionsError 
        ? `Error: ${questionsError.message}` 
        : questionsLoading 
          ? 'Loading sample...' 
          : sampleQuestions 
            ? `${sampleQuestions.length} questions in sample quiz`
            : 'No sample quiz available',
      details: sampleQuestions && sampleQuestions.length > 0 ? `Sample quiz: ${quizzes[0]?.title}` : null
    },
    {
      name: 'Training Assignments',
      status: assignmentsError ? 'error' : assignmentsLoading ? 'loading' : assignments.length >= 0 ? 'success' : 'warning',
      message: assignmentsError 
        ? `Error: ${assignmentsError.message}` 
        : assignmentsLoading 
          ? 'Loading...' 
          : `${assignments.length} assignments found`,
      details: !assignmentsLoading && assignments.length > 0 
        ? `Pending: ${assignments.filter(a => a.status === 'pending').length}, In Progress: ${assignments.filter(a => a.status === 'in_progress').length}, Completed: ${assignments.filter(a => a.status === 'completed').length}`
        : null
    },
    {
      name: 'System Permissions',
      status: user && ['admin', 'superadmin', 'manager'].includes(user.role) ? 'success' : user ? 'warning' : 'error',
      message: user 
        ? ['admin', 'superadmin', 'manager'].includes(user.role) 
          ? 'Full management access' 
          : 'Student access only'
        : 'No user permissions',
      details: user ? `Role: ${user.role}` : null
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'loading':
        return <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default' as const,
      warning: 'secondary' as const,
      error: 'destructive' as const,
      loading: 'outline' as const
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const overallStatus = diagnosticItems.some(item => item.status === 'error') 
    ? 'error' 
    : diagnosticItems.some(item => item.status === 'warning') 
      ? 'warning' 
      : 'success';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <CardTitle>Training System Diagnostics</CardTitle>
          </div>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          System health check - {new Date().toLocaleString()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {diagnosticItems.map((item, index) => (
            <div key={index} className="flex items-start justify-between p-4 rounded-lg border">
              <div className="flex items-start gap-3 flex-1">
                {getStatusIcon(item.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{item.name}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                  {item.details && (
                    <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 rounded-lg border-2" style={{
          borderColor: overallStatus === 'success' ? 'hsl(var(--success))' : 
                      overallStatus === 'warning' ? 'hsl(var(--warning))' : 
                      'hsl(var(--destructive))'
        }}>
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(overallStatus)}
            <h3 className="font-semibold">
              {overallStatus === 'success' 
                ? 'Training System Operational' 
                : overallStatus === 'warning' 
                  ? 'Training System Partially Functional'
                  : 'Training System Issues Detected'}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {overallStatus === 'success' 
              ? 'All core training system components are working correctly. Users can take quizzes and complete assignments.'
              : overallStatus === 'warning'
                ? 'The training system is functional but some components may have limited data or functionality.'
                : 'Critical issues detected that may prevent normal training operations. Please address the errors above.'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
          {user && ['admin', 'superadmin', 'manager'].includes(user.role) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => console.log('Training System Diagnostics:', { 
                user, 
                courses: courses.length, 
                quizzes: quizzes.length, 
                assignments: assignments.length 
              })}
              className="gap-2"
            >
              Log Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingSystemDiagnostics;