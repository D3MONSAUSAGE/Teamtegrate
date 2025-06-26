
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from 'lucide-react';

interface TimeTrackingErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface TimeTrackingErrorBoundaryProps {
  children: React.ReactNode;
}

class TimeTrackingErrorBoundary extends React.Component<
  TimeTrackingErrorBoundaryProps,
  TimeTrackingErrorBoundaryState
> {
  constructor(props: TimeTrackingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TimeTrackingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Time tracking error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="space-y-2">
                <h3 className="font-semibold">Time Tracking Error</h3>
                <p className="text-sm text-muted-foreground">
                  Something went wrong with the time tracking component
                </p>
              </div>
              <Button
                onClick={this.resetError}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default TimeTrackingErrorBoundary;
