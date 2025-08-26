import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useChatConnectionStatus } from '@/hooks/useChatConnectionStatus';

interface ChatConnectionIndicatorProps {
  roomId?: string;
  onRetry?: () => void;
  className?: string;
}

export const ChatConnectionIndicator: React.FC<ChatConnectionIndicatorProps> = ({
  roomId,
  onRetry,
  className = ''
}) => {
  const chatStatus = useChatConnectionStatus({ roomId, enableRealtime: true });
  
  if (!chatStatus.shouldShowIndicator()) {
    return null;
  }

  const getStatusIcon = () => {
    if (!chatStatus.isOnline) {
      return <WifiOff className="h-3 w-3" />;
    }
    
    if (chatStatus.isConnecting) {
      return <RefreshCw className="h-3 w-3 animate-spin" />;
    }
    
    if (chatStatus.messageQueueSize > 0) {
      return <Clock className="h-3 w-3" />;
    }
    
    if (chatStatus.connectionQuality === 'poor') {
      return <AlertCircle className="h-3 w-3" />;
    }
    
    if (chatStatus.realtimeConnected) {
      return <CheckCircle2 className="h-3 w-3" />;
    }
    
    return <Wifi className="h-3 w-3" />;
  };

  const getIndicatorColor = () => {
    if (!chatStatus.isOnline) return 'text-destructive';
    if (chatStatus.connectionQuality === 'poor' || chatStatus.messageQueueSize > 0) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={chatStatus.getStatusVariant()} className="flex items-center gap-1 text-xs">
        <span className={getIndicatorColor()}>
          {getStatusIcon()}
        </span>
        {chatStatus.getStatusText()}
      </Badge>
      
      {onRetry && (chatStatus.isConnecting || !chatStatus.isFullyConnected) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          disabled={chatStatus.isConnecting}
          className="h-6 px-2 text-xs"
        >
          {chatStatus.isConnecting ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Retry
        </Button>
      )}
    </div>
  );
};