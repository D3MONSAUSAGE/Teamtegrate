import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MessageStatusProps {
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
  onRetry?: () => void;
  className?: string;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ 
  status, 
  onRetry, 
  className 
}) => {
  if (!status) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 animate-pulse text-muted-foreground" />;
      case 'sent':
        return <Check className="h-3 w-3 text-primary/60" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      case 'failed':
        return (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-destructive" />
            {onRetry && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                onClick={onRetry}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Failed to send';
      default:
        return '';
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)} title={getStatusText()}>
      {getStatusIcon()}
    </div>
  );
};