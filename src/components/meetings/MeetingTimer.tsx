import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Clock,
  AlertCircle,
  Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerSegment {
  id: string;
  name: string;
  duration: number; // in minutes
  completed?: boolean;
  elapsed?: number; // in seconds
}

interface MeetingTimerProps {
  scheduledDuration?: number; // in minutes
  segments?: TimerSegment[];
  onSegmentComplete?: (segmentId: string) => void;
  onMeetingOverrun?: () => void;
  className?: string;
}

export const MeetingTimer: React.FC<MeetingTimerProps> = ({
  scheduledDuration = 60,
  segments = [],
  onSegmentComplete,
  onMeetingOverrun,
  className
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [hasOverrun, setHasOverrun] = useState(false);

  const totalScheduledSeconds = scheduledDuration * 60;
  const currentSegment = segments[currentSegmentIndex];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => {
          const newElapsed = prev + 1;
          
          // Check for meeting overrun
          if (newElapsed > totalScheduledSeconds && !hasOverrun) {
            setHasOverrun(true);
            onMeetingOverrun?.();
          }

          // Check for segment completion
          if (currentSegment && !currentSegment.completed) {
            const segmentElapsed = newElapsed - (segments.slice(0, currentSegmentIndex).reduce((sum, seg) => sum + (seg.duration * 60), 0));
            
            if (segmentElapsed >= (currentSegment.duration * 60)) {
              onSegmentComplete?.(currentSegment.id);
              setCurrentSegmentIndex(prev => Math.min(prev + 1, segments.length - 1));
            }
          }

          return newElapsed;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, currentSegment, currentSegmentIndex, segments, totalScheduledSeconds, hasOverrun, onMeetingOverrun, onSegmentComplete]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setCurrentSegmentIndex(0);
    setHasOverrun(false);
  };

  const addBreakTime = (minutes: number) => {
    setElapsedSeconds(prev => prev + (minutes * 60));
  };

  const progressPercentage = Math.min((elapsedSeconds / totalScheduledSeconds) * 100, 100);
  const remainingSeconds = Math.max(totalScheduledSeconds - elapsedSeconds, 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Meeting Timer
          </CardTitle>
          
          <div className="flex gap-2">
            {hasOverrun && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertCircle className="h-3 w-3" />
                Overrun
              </Badge>
            )}
            
            {isActive && !isPaused && (
              <Badge variant="default" className="text-xs bg-green-600">
                Active
              </Badge>
            )}
            
            {isPaused && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                Paused
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Timer Display */}
        <div className="text-center space-y-2">
          <div className={cn(
            "text-4xl font-mono font-bold",
            hasOverrun ? 'text-red-600' : isActive ? 'text-green-600' : 'text-muted-foreground'
          )}>
            {formatTime(elapsedSeconds)}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {remainingSeconds > 0 
              ? `${formatTime(remainingSeconds)} remaining`
              : `${formatTime(elapsedSeconds - totalScheduledSeconds)} over schedule`
            }
          </div>

          <Progress 
            value={progressPercentage} 
            className={cn(
              "w-full",
              hasOverrun ? 'bg-red-100' : ''
            )}
          />
        </div>

        {/* Current Segment Display */}
        {currentSegment && (
          <div className="bg-muted/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{currentSegment.name}</span>
              <Badge variant="outline" className="text-xs">
                {currentSegment.duration}min
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Segment {currentSegmentIndex + 1} of {segments.length}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          {!isActive ? (
            <Button
              onClick={handleStart}
              className="gap-2"
              size="sm"
            >
              <Play className="h-4 w-4" />
              Start Meeting
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button
                  onClick={handleResume}
                  className="gap-2"
                  size="sm"
                >
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="gap-2"
                  size="sm"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              
              <Button
                onClick={handleStop}
                variant="outline"
                className="gap-2"
                size="sm"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          {/* Break Time Buttons */}
          <div className="flex gap-1">
            <Button
              onClick={() => addBreakTime(5)}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              disabled={!isActive}
            >
              <Coffee className="h-3 w-3" />
              +5min break
            </Button>
          </div>
        </div>

        {/* Segments Overview */}
        {segments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Agenda</h4>
            <div className="space-y-1">
              {segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded text-xs",
                    index === currentSegmentIndex 
                      ? 'bg-primary/10 text-primary' 
                      : index < currentSegmentIndex
                        ? 'bg-green-50 text-green-700 opacity-75'
                        : 'bg-muted/30'
                  )}
                >
                  <span className={cn(
                    index < currentSegmentIndex ? 'line-through' : ''
                  )}>
                    {segment.name}
                  </span>
                  <span>{segment.duration}min</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};