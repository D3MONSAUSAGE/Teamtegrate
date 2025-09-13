import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Timer, AlertTriangle } from 'lucide-react';
import { useChecklistTimeWindow } from '@/hooks/useChecklistTimeWindow';
import { getTimeStatusStyling } from '@/utils/checklistTimeUtils';
import { Checklist, ChecklistExecution } from '@/types/checklist';
import { cn } from '@/lib/utils';

interface ChecklistCountdownTimerProps {
  checklist: Checklist | ChecklistExecution['checklist'] | null;
  executionDate?: string;
  variant?: 'card' | 'inline' | 'minimal';
  className?: string;
}

export const ChecklistCountdownTimer: React.FC<ChecklistCountdownTimerProps> = ({
  checklist,
  executionDate,
  variant = 'inline',
  className
}) => {
  const { status, message, timeUntilAvailable, timeUntilExpired, isInWindow } = useChecklistTimeWindow(
    checklist, 
    executionDate, 
    1000 // Update every second for countdown
  );
  
  const [displayTime, setDisplayTime] = useState<string>('');
  const styling = getTimeStatusStyling(status);

  useEffect(() => {
    const updateDisplayTime = () => {
      const targetTime = isInWindow ? timeUntilExpired : timeUntilAvailable;
      if (!targetTime || targetTime <= 0) {
        setDisplayTime('');
        return;
      }

      const hours = Math.floor(targetTime / 60);
      const minutes = targetTime % 60;
      
      if (hours > 0) {
        setDisplayTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
      } else {
        setDisplayTime(`${minutes}m`);
      }
    };

    updateDisplayTime();
    const interval = setInterval(updateDisplayTime, 1000);
    return () => clearInterval(interval);
  }, [timeUntilAvailable, timeUntilExpired, isInWindow]);

  if (status === 'no-window') {
    return null;
  }

  const getIcon = () => {
    if (isInWindow && timeUntilExpired && timeUntilExpired <= 30) {
      return <AlertTriangle className={cn('h-4 w-4', styling.icon, 'animate-pulse')} />;
    }
    return isInWindow ? 
      <Timer className={cn('h-4 w-4', styling.icon)} /> : 
      <Clock className={cn('h-4 w-4', styling.icon)} />;
  };

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      {getIcon()}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isInWindow ? 'Time Remaining' : 'Starts In'}
          </span>
          {displayTime && (
            <Badge 
              variant="outline" 
              className={cn(
                'font-mono text-xs',
                styling.badge,
                isInWindow && timeUntilExpired && timeUntilExpired <= 30 && 'animate-pulse'
              )}
            >
              {displayTime}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{message}</span>
      </div>
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className={cn('border-l-4', `border-l-${styling.icon.split('-')[1]}-500`, className)}>
        <CardContent className="p-3">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1 text-xs', className)}>
        {getIcon()}
        {displayTime && (
          <span className={cn('font-mono', styling.icon)}>{displayTime}</span>
        )}
      </div>
    );
  }

  return content;
};

export default ChecklistCountdownTimer;