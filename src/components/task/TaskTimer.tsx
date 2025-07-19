
import React from 'react';
import { Clock, Play, Square, Pause } from 'lucide-react';
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

  const handleToggleTimer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      await stopTaskWork();
    } else {
      await startTaskWork(taskId, taskTitle);
    }
  };

  const handlePauseResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 text-xs",
        "bg-gradient-to-r from-slate-50/80 to-slate-100/60 dark:from-slate-900/60 dark:to-slate-800/80",
        "backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50",
        "px-3 py-2 rounded-lg shadow-sm transition-all duration-300",
        "hover:shadow-md hover:border-slate-300/60 dark:hover:border-slate-600/60",
        isActive && "ring-2 ring-green-400/30 bg-gradient-to-r from-green-50/80 to-emerald-50/60 dark:from-green-950/60 dark:to-emerald-950/40 border-green-300/50 dark:border-green-700/50",
        isPaused && "ring-2 ring-yellow-400/30 bg-gradient-to-r from-yellow-50/80 to-amber-50/60 dark:from-yellow-950/60 dark:to-amber-950/40 border-yellow-300/50 dark:border-yellow-700/50",
        className
      )}>
        {/* Active timer display */}
        {isActive && (
          <div className={cn(
            "flex items-center gap-2",
            isPaused ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
          )}>
            <div className="relative">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isPaused 
                  ? "bg-yellow-500 dark:bg-yellow-400" 
                  : "bg-green-500 dark:bg-green-400 animate-pulse"
              )} />
              {!isPaused && (
                <div className="absolute inset-0 w-2 h-2 bg-green-500/30 dark:bg-green-400/30 rounded-full animate-ping" />
              )}
            </div>
            <span className="font-mono text-xs font-semibold tracking-wide">
              {formatTime(timerState.elapsedSeconds)}
            </span>
            {isPaused && (
              <span className="text-xs opacity-75 font-medium">PAUSED</span>
            )}
          </div>
        )}
        
        {/* Total time display */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium">
            {totalMinutes > 0 ? formatTotalTime(totalMinutes) : '0m'}
          </span>
        </div>
        
        {/* Control buttons */}
        {showControls && (
          <div className="flex items-center gap-1">
            {/* Pause/Resume button - only show when active */}
            {isActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePauseResume}
                disabled={isLoading}
                className={cn(
                  "h-6 px-2 text-xs font-semibold transition-all duration-300",
                  "hover:scale-105 active:scale-95",
                  isPaused 
                    ? "bg-gradient-to-r from-green-500/90 to-green-600/90 hover:from-green-600/90 hover:to-green-700/90 text-white border-0 shadow-md hover:shadow-lg"
                    : "bg-gradient-to-r from-yellow-500/90 to-yellow-600/90 hover:from-yellow-600/90 hover:to-yellow-700/90 text-white border-0 shadow-md hover:shadow-lg"
                )}
              >
                {isPaused ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <Pause className="h-3 w-3" />
                )}
              </Button>
            )}
            
            {/* Start/Stop button */}
            <Button
              size="sm"
              variant={isActive ? "destructive" : "outline"}
              onClick={handleToggleTimer}
              disabled={isLoading}
              className={cn(
                "h-6 px-2 text-xs font-semibold transition-all duration-300",
                "hover:scale-105 active:scale-95",
                isActive 
                  ? "bg-red-500/90 hover:bg-red-600/90 text-white shadow-md hover:shadow-lg" 
                  : "bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-600/90 hover:to-blue-700/90 text-white border-0 shadow-md hover:shadow-lg"
              )}
            >
              {isLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isActive ? (
                <Square className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between p-3 bg-muted/30 rounded-lg", className)}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isActive ? (
            <div className={cn(
              "flex items-center gap-2",
              isPaused ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
            )}>
              <div className={cn(
                "w-3 h-3 rounded-full",
                isPaused 
                  ? "bg-yellow-500 dark:bg-yellow-400" 
                  : "bg-green-500 dark:bg-green-400 animate-pulse"
              )} />
              <span className="font-mono font-bold text-lg">
                {formatTime(timerState.elapsedSeconds)}
              </span>
              <span className="text-sm font-semibold">
                {isPaused ? 'PAUSED' : 'Active'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Not tracking</span>
            </div>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          Total today: {totalMinutes > 0 ? formatTotalTime(totalMinutes) : '0m'}
        </div>
      </div>

      {showControls && (
        <div className="flex items-center gap-2">
          {/* Pause/Resume button - only show when active */}
          {isActive && (
            <Button
              size="sm"
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
            size="sm"
            variant={isActive ? "destructive" : "default"}
            onClick={handleToggleTimer}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isActive ? (
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
        </div>
      )}
    </div>
  );
};

export default TaskTimer;
