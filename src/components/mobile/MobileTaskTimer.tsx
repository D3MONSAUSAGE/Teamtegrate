
import React from 'react';
import { Play, Square, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CircularProgress from './CircularProgress';
import { useTaskTimeTracking } from '@/hooks/useTaskTimeTracking';
import { cn } from '@/lib/utils';

interface MobileTaskTimerProps {
  taskId: string;
  taskTitle: string;
  compact?: boolean;
  className?: string;
}

const MobileTaskTimer: React.FC<MobileTaskTimerProps> = ({ 
  taskId, 
  taskTitle, 
  compact = false,
  className 
}) => {
  const { timerState, isLoading, startTaskWork, stopTaskWork, pauseTaskWork, resumeTaskWork, getTaskTotalTime } = useTaskTimeTracking();
  
  const isActive = timerState.activeTaskId === taskId;
  const isPaused = isActive && timerState.isPaused;
  const totalMinutes = getTaskTotalTime(taskId);
  
  // Calculate progress based on elapsed time (assuming 2-hour session target)
  const progressPercentage = isActive 
    ? Math.min((timerState.elapsedSeconds / 7200) * 100, 100) // 7200 seconds = 2 hours
    : 0;

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      primary: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
      minutes: mins,
      seconds: secs
    };
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
    
    if (!isActive) return;
    
    if (isPaused) {
      await resumeTaskWork();
    } else {
      await pauseTaskWork();
    }
  };

  const timeDisplay = formatTime(timerState.elapsedSeconds);

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-gradient-to-r from-slate-50/80 to-slate-100/60 dark:from-slate-900/60 dark:to-slate-800/80",
        "backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm",
        isActive && "ring-2 ring-blue-400/30 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/60 dark:to-indigo-950/40",
        className
      )}>
        {/* Mini Progress Ring */}
        <CircularProgress
          progress={progressPercentage}
          size={40}
          strokeWidth={3}
          variant={isActive ? 'work' : 'default'}
          animated={isActive}
          pulsing={isActive && !isPaused}
        >
          <div className="text-xs font-bold">
            {isActive ? timeDisplay.minutes : totalMinutes}
          </div>
        </CircularProgress>
        
        {/* Time Info */}
        <div className="flex-1 min-w-0">
          {isActive ? (
            <div className="font-mono text-sm font-semibold">
              {timeDisplay.primary}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Total: {formatTotalTime(totalMinutes)}
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-1">
          {isActive && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePauseResume}
              disabled={isLoading}
              className="h-8 w-8 p-0 rounded-full"
            >
              {isPaused ? (
                <Play className="h-3 w-3" />
              ) : (
                <Pause className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <Button
            size="sm"
            variant={isActive ? "destructive" : "default"}
            onClick={handleToggleTimer}
            disabled={isLoading}
            className="h-8 w-8 p-0 rounded-full"
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
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center gap-4 p-6 rounded-2xl",
      "bg-gradient-to-br from-background via-background to-muted/20 border shadow-lg",
      className
    )}>
      {/* Main Progress Ring */}
      <CircularProgress
        progress={progressPercentage}
        size={120}
        strokeWidth={8}
        variant={isActive ? 'work' : 'default'}
        animated={isActive}
        pulsing={isActive && !isPaused}
      >
        <div className="text-center">
          <div className="text-2xl font-bold font-mono">
            {isActive ? timeDisplay.primary : '00:00'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {isActive ? (isPaused ? 'Paused' : 'Active') : 'Ready'}
          </div>
        </div>
      </CircularProgress>
      
      {/* Total Time */}
      <div className="text-center">
        <div className="text-sm text-muted-foreground">
          Total today: {formatTotalTime(totalMinutes)}
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-3">
        {isActive && (
          <Button
            variant="outline"
            onClick={handlePauseResume}
            disabled={isLoading}
            className="h-10 px-4 rounded-full"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>
        )}
        
        <Button
          variant={isActive ? "destructive" : "default"}
          onClick={handleToggleTimer}
          disabled={isLoading}
          className="h-10 px-6 rounded-full"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : isActive ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MobileTaskTimer;

