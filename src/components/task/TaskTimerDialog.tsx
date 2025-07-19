import React from 'react';
import { Clock, Play, Square, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskTimeTracking } from '@/hooks/useTaskTimeTracking';
import { cn } from '@/lib/utils';

interface TaskTimerDialogProps {
  taskId: string;
  taskTitle: string;
  className?: string;
}

const TaskTimerDialog: React.FC<TaskTimerDialogProps> = ({ 
  taskId, 
  taskTitle, 
  className 
}) => {
  const { timerState, isLoading, startTaskWork, stopTaskWork, pauseTaskWork, resumeTaskWork, getTaskTotalTime } = useTaskTimeTracking();
  
  const isActive = timerState.activeTaskId === taskId;
  const isPaused = isActive && timerState.isPaused;
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

  const handleToggleTimer = async () => {
    if (isActive) {
      await stopTaskWork();
    } else {
      await startTaskWork(taskId, taskTitle);
    }
  };

  const handlePauseResume = async () => {
    if (!isActive) {
      console.log('⚠️ Not active task, cannot pause/resume');
      return;
    }
    
    if (isPaused) {
      console.log('▶️ Attempting to resume...');
      await resumeTaskWork();
    } else {
      console.log('⏸️ Attempting to pause...');
      await pauseTaskWork();
    }
  };

  return (
    <div className={cn("flex flex-col gap-4 p-4 bg-muted/20 rounded-lg border", className)}>
      {/* Timer Display */}
      <div className="flex items-center justify-center gap-3">
        {isActive ? (
          <div className={cn(
            "flex items-center gap-3",
            isPaused ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
          )}>
            <div className="relative">
              <div className={cn(
                "w-4 h-4 rounded-full",
                isPaused 
                  ? "bg-yellow-500 dark:bg-yellow-400" 
                  : "bg-green-500 dark:bg-green-400 animate-pulse"
              )} />
              {!isPaused && (
                <div className="absolute inset-0 w-4 h-4 bg-green-500/30 dark:bg-green-400/30 rounded-full animate-ping" />
              )}
            </div>
            <span className="font-mono font-bold text-2xl">
              {formatTime(timerState.elapsedSeconds)}
            </span>
            {!isPaused && (
              <span className="text-lg font-semibold">
                Active
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="h-6 w-6" />
            <span className="text-lg font-semibold">Timer Ready</span>
          </div>
        )}
      </div>

      {/* Total Time Today */}
      <div className="text-center text-sm text-muted-foreground">
        Total today: {totalMinutes > 0 ? formatTotalTime(totalMinutes) : '0m'}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        {/* Pause/Resume button - only show when active */}
        {isActive && (
          <Button
            variant="outline"
            onClick={handlePauseResume}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isPaused ? (
              <>
                <Play className="h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            )}
          </Button>
        )}
        
        {/* Start/Stop button */}
        <Button
          variant={isActive ? "destructive" : "default"}
          onClick={handleToggleTimer}
          disabled={isLoading}
          className="flex items-center gap-2"
          size="lg"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isActive ? (
            <>
              <Square className="h-4 w-4" />
              Stop Working
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Working
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TaskTimerDialog;
