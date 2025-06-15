
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import ConnectionStatus from '@/components/dashboard/ConnectionStatus';

interface ProjectsErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ProjectsErrorBoundaryProps {
  children: React.ReactNode;
  onRetry: () => void;
}

class ProjectsErrorBoundary extends React.Component<
  ProjectsErrorBoundaryProps,
  ProjectsErrorBoundaryState
> {
  constructor(props: ProjectsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ProjectsErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ProjectsErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onRetry();
  };

  getErrorType = () => {
    const message = this.state.error?.message?.toLowerCase() || '';
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    }
    return 'unknown';
  };

  render() {
    if (this.state.hasError) {
      const errorType = this.getErrorType();
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 relative overflow-hidden">
          <div className="container mx-auto max-w-4xl px-4 py-8">
            <ConnectionStatus 
              lastError={this.state.error?.message} 
              onRetry={this.handleRetry}
            />
            
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md space-y-6 bg-card/60 backdrop-blur-xl border border-border/40 rounded-3xl p-8 shadow-2xl">
                <div className="flex justify-center">
                  {errorType === 'network' ? (
                    <WifiOff className="h-16 w-16 text-red-500" />
                  ) : (
                    <AlertCircle className="h-16 w-16 text-red-500" />
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {errorType === 'network' ? 'Connection Issue' : 'Something went wrong'}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {errorType === 'network' 
                      ? 'Unable to load your projects. Please check your internet connection.'
                      : errorType === 'permission'
                      ? 'You may not have permission to access these projects.'
                      : 'An unexpected error occurred while loading your projects.'
                    }
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="text-sm text-left bg-muted p-3 rounded-md mt-4">
                      <summary className="cursor-pointer font-medium">Error Details</summary>
                      <pre className="mt-2 text-xs overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Refresh Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProjectsErrorBoundary;
