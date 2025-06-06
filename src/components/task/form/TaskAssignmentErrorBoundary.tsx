
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
}

interface TaskAssignmentErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class TaskAssignmentErrorBoundary extends React.Component<
  TaskAssignmentErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: TaskAssignmentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TaskAssignment Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 border border-red-200 rounded-md bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">Assignment component error</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TaskAssignmentErrorBoundary;
