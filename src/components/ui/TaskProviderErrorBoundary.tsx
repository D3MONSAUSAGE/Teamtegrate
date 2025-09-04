import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface TaskProviderErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface TaskProviderErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class TaskProviderErrorBoundary extends React.Component<TaskProviderErrorBoundaryProps, TaskProviderErrorBoundaryState> {
  constructor(props: TaskProviderErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TaskProviderErrorBoundaryState {
    // Check if it's a TaskProvider related error
    if (error.message.includes('useTask must be used within a TaskProvider')) {
      return { hasError: true, error };
    }
    
    // Let other errors bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (error.message.includes('useTask must be used within a TaskProvider')) {
      console.error('TaskProvider error caught by boundary:', error, errorInfo);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || TaskProviderErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

const TaskProviderErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
  <Card className="border-destructive m-4">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        Task Provider Error
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The task management system is temporarily unavailable. Some features may not work properly.
      </p>
      <Button onClick={retry} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </CardContent>
  </Card>
);

export default TaskProviderErrorBoundary;