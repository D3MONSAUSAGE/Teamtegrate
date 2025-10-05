import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface TrainingErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const TrainingErrorFallback: React.FC<TrainingErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  console.error('TrainingErrorFallback: Training error occurred:', error);
  
  return (
    <div style={{ padding: '20px', background: '#ffebee', border: '2px solid red', borderRadius: '8px' }}>
      <Card className="h-full bg-card border border-destructive/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Training Page Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Something went wrong loading the training page.
          </p>
          <div className="text-left bg-muted p-4 rounded">
            <h4 className="font-semibold mb-2">Error Details:</h4>
            <p className="text-sm font-mono">{error.message}</p>
            <p className="text-xs text-muted-foreground mt-2">Stack: {error.stack?.slice(0, 200)}...</p>
          </div>
          <div className="space-y-2">
            <Button onClick={resetErrorBoundary} className="gap-2 w-full">
              <RefreshCw className="w-4 h-4" />
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
        </CardContent>
      </Card>
    </div>
  );
};

interface TrainingErrorBoundaryProps {
  children: React.ReactNode;
}

export const TrainingErrorBoundary: React.FC<TrainingErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={TrainingErrorFallback}
      onError={(error, errorInfo) => {
        console.error('TrainingErrorBoundary: Error caught:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};