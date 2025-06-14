
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
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

  if (isOnline && !lastError) {
    return null; // Don't show when everything is working
  }

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isConnecting ? 'Connecting...' : (isOnline ? 'Online' : 'Offline')}
                </Badge>
                
                {retryCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Retry attempt: {retryCount}
                  </span>
                )}
              </div>
              
              {lastError && (
                <div className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-3 w-3" />
                  <span>{lastError}</span>
                </div>
              )}
              
              {!isOnline && lastConnected && (
                <span className="text-xs text-muted-foreground">
                  Last connected: {lastConnected.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {onRetry && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRetry}
              disabled={isLoading || isConnecting}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${(isLoading || isConnecting) ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionStatus;
