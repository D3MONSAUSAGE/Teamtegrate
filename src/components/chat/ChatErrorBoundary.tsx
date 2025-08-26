import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ChatErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ChatErrorFallback: React.FC<ChatErrorFallbackProps> = ({ error, resetErrorBoundary }) => (
  <Card className="h-full bg-card border border-destructive/20">
    <CardHeader className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <CardTitle className="text-destructive">Chat Error</CardTitle>
    </CardHeader>
    <CardContent className="text-center space-y-4">
      <p className="text-muted-foreground">
        Something went wrong with the chat interface.
      </p>
      <details className="text-left">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          Error Details
        </summary>
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
          {error.message}
        </pre>
      </details>
      <Button onClick={resetErrorBoundary} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </CardContent>
  </Card>
);

interface ChatErrorBoundaryProps {
  children: React.ReactNode;
}

export const ChatErrorBoundary: React.FC<ChatErrorBoundaryProps> = ({ children }) => (
  <ErrorBoundary
    FallbackComponent={ChatErrorFallback}
    onError={(error, errorInfo) => {
      console.error('[CHAT_ERROR]', error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);