import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface TrainingErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface TrainingErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void; goBack: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class TrainingErrorBoundary extends React.Component<TrainingErrorBoundaryProps, TrainingErrorBoundaryState> {
  constructor(props: TrainingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TrainingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log the error for debugging
    console.error('Training Error Boundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  goBack = () => {
    // This will be handled by the parent component
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to training page
      window.location.href = '/dashboard/training';
    }
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || TrainingErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} goBack={this.goBack} />;
    }

    return this.props.children;
  }
}

const TrainingErrorFallback: React.FC<{ 
  error?: Error; 
  retry: () => void; 
  goBack: () => void; 
}> = ({ error, retry, goBack }) => {
  const isQuizError = error?.message?.includes('quiz') || error?.message?.includes('Quiz');
  const isHooksError = error?.message?.includes('hooks') || error?.message?.includes('Hooks');
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive">
            {isQuizError ? 'Quiz System Error' : isHooksError ? 'Component Error' : 'Training System Error'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
            <p className="text-sm text-muted-foreground mb-2">
              {isQuizError 
                ? 'There was an issue loading or processing the quiz. This may be due to missing quiz data or a configuration problem.'
                : isHooksError
                ? 'A component rendering error occurred. This is usually caused by changes in data structure or component state.'
                : 'The training system encountered an unexpected error.'}
            </p>
            {error && (
              <details className="text-left">
                <summary className="cursor-pointer text-xs font-medium text-destructive">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <Button onClick={retry} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={goBack} variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {isQuizError && (
                <p>If this problem persists, the quiz may need to be recreated or its questions restored.</p>
              )}
              {isHooksError && (
                <p>If this problem persists, try refreshing the page or contact support.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingErrorBoundary;