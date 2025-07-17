
import React from 'react';
import { Clock, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskTimeTracking } from '@/hooks/useTaskTimeTracking';
import { cn } from '@/lib/utils';

interface TaskTimerProps {
  taskId: string;
  taskTitle: string;
  compact?: boolean;
  showControls?: boolean;
  className?: string;
}

const TaskTimer: React.FC<TaskTimerProps> = ({ 
  taskId, 
  taskTitle, 
  compact = false, 
  showControls = true,
  className 
}) => {
  const { timerState, isLoading, startTaskWork, stopTaskWork, getTaskTotalTime } = useTaskTimeTracking();
  
  const isActive = timerState.activeTaskId === taskId;
  const totalMinutes = getTaskTotalTime(taskId);
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleToggleTimer = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (isActive) {
      await stopTaskWork();
    } else {
      await startTaskWork(taskId, taskTitle);
    }
  };

  // Don't render anything if no active timer and no total time
  if (!isActive && totalMinutes === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        {isActive && (
          <div className="flex items-center gap-1 text-green-600">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="font-mono text-xs">{formatTime(timerState.elapsedSeconds)}</span>
          </div>
        )}
        {totalMinutes > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTotalTime(totalMinutes)}</span>
          </div>
        )}
        {showControls && (
          <Button
            size="sm"
            variant={isActive ? "destructive" : "outline"}
            onClick={handleToggleTimer}
            disabled={isLoading}
            className="h-5 px-1.5 text-xs"
          >
            {isActive ? <Square className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between p-3 bg-muted/30 rounded-lg", className)}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isActive ? (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-mono font-bold text-lg">
                {formatTime(timerState.elapsedSeconds)}
              </span>
              <span className="text-sm">Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Not tracking</span>
            </div>
          )}
        </div>
        
        {totalMinutes > 0 && (
          <div className="text-sm text-muted-foreground">
            Total today: {formatTotalTime(totalMinutes)}
          </div>
        )}
      </div>

      {showControls && (
        <Button
          size="sm"
          variant={isActive ? "destructive" : "default"}
          onClick={handleToggleTimer}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isActive ? (
            <>
              <Square className="h-4 w-4" />
              Stop
            </>
          ) : (
            <>  
              <Play className="h-4 w-4" />
              Start
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default TaskTimer;
