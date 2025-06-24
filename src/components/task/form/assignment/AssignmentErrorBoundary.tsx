
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AssignmentErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class AssignmentErrorBoundary extends React.Component<
  AssignmentErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: AssignmentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('AssignmentErrorBoundary: Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AssignmentErrorBoundary: Component error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="space-y-3 p-4 border border-red-200 rounded-md bg-red-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">Assignment Error</span>
          </div>
          <p className="text-xs text-red-600">
            Task assignment component failed to load. You can still create the task without assignment.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false })}
            className="text-xs"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AssignmentErrorBoundary;
