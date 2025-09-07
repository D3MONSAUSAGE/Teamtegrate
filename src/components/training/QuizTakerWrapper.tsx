import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import QuizTaker from './QuizTaker';
import TrainingErrorBoundary from './TrainingErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';

interface QuizTakerWrapperProps {
  quiz: any;
  onComplete: (results: any) => void;
  onExit: () => void;
  currentAttempts?: number;
  hasNextModule?: boolean;
  onRetakeQuiz?: () => void;
}

const QuizTakerWrapper: React.FC<QuizTakerWrapperProps> = (props) => {
  const { user } = useAuth();

  // Pre-flight checks
  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You must be logged in to take a quiz.
          </p>
          <Button onClick={props.onExit} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Training
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!user.organizationId) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Organization Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Your account is not associated with an organization. Please contact your administrator.
          </p>
          <Button onClick={props.onExit} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Training
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!props.quiz || !props.quiz.id) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Quiz Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The requested quiz could not be loaded. It may have been removed or you may not have access to it.
          </p>
          <Button onClick={props.onExit} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Training
          </Button>
        </CardContent>
      </Card>
    );
  }

  // All checks passed, render the quiz with error boundary
  return (
    <TrainingErrorBoundary
      onError={(error, errorInfo) => {
        console.error('QuizTaker Error:', { error, errorInfo, quizId: props.quiz?.id, userId: user.id });
      }}
    >
      <QuizTaker {...props} />
    </TrainingErrorBoundary>
  );
};

export default QuizTakerWrapper;