
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

interface ConnectionStatusProps {
  lastError?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  lastError,
  onRetry,
  isLoading = false
}) => {
  const { isOnline, isConnecting, lastConnected, retryCount } = useConnectionStatus();

  // Only show status for actual network connectivity issues, not query/database errors
  const isNetworkError = lastError && (
    lastError.includes('Network connection issue') ||
    lastError.includes('Failed to fetch') ||
    lastError.includes('timeout') ||
    lastError.includes('connection')
  );

  // Show status when there are real network issues or when explicitly needed
  const shouldShow = !isOnline || isConnecting || (retryCount > 0 && isNetworkError);

  if (!shouldShow) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
    if (isNetworkError) return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20';
    if (isConnecting) return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20';
    return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-600" />;
    if (isConnecting) return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
    return <Wifi className="h-4 w-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Reconnecting...';
    if (!isOnline) return 'Connection Lost';
    if (isNetworkError) return 'Network Issues Detected';
    return 'Connected';
  };

  const getStatusVariant = () => {
    if (!isOnline) return 'destructive' as const;
    if (isNetworkError) return 'secondary' as const;
    if (isConnecting) return 'secondary' as const;
    return 'default' as const;
  };

  return (
    <Card className={`${getStatusColor()} transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant()}>
                  {getStatusText()}
                </Badge>
                
                {retryCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Attempt {retryCount}/3
                  </span>
                )}
              </div>
              
              {isNetworkError && (
                <div className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    Poor network connection - retrying automatically
                  </span>
                </div>
              )}
              
              {!isOnline && lastConnected && (
                <span className="text-xs text-muted-foreground">
                  Last connected: {lastConnected.toLocaleTimeString()}
                </span>
              )}
              
              {isOnline && !isNetworkError && retryCount === 0 && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  <span>Connection restored</span>
                </div>
              )}
            </div>
          </div>

          {onRetry && (isConnecting || !isOnline || isNetworkError) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRetry}
              disabled={isLoading || isConnecting}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${(isLoading || isConnecting) ? 'animate-spin' : ''}`} />
              {isConnecting ? 'Connecting...' : 'Retry'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionStatus;
