
import React, { useState, useEffect, useRef } from 'react';
import { Task } from '@/types';
import { FocusSession } from '@/pages/FocusZonePage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  selectedTask: Task | null;
  duration: number; // in minutes
  onSessionUpdate: (session: FocusSession) => void;
  onSessionComplete: () => void;
}

const FocusTimer: React.FC<FocusTimerProps> = ({
  selectedTask,
  duration,
  onSessionUpdate,
  onSessionComplete
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - timeRemaining) / totalSeconds) * 100;

  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeRemaining]);

  useEffect(() => {
    setTimeRemaining(duration * 60);
  }, [duration]);

  useEffect(() => {
    if (selectedTask) {
      const session: FocusSession = {
        id: `${selectedTask.id}-${Date.now()}`,
        taskId: selectedTask.id,
        duration: duration * 60,
        timeRemaining,
        isActive,
        isPaused,
        progress
      };
      onSessionUpdate(session);
    }
  }, [selectedTask, timeRemaining, isActive, isPaused, progress, duration, onSessionUpdate]);

  const handleStart = () => {
    if (!selectedTask) return;
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
    setTimeRemaining(duration * 60);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(duration * 60);
  };

  const handleComplete = () => {
    setIsActive(false);
    setIsPaused(false);
    onSessionComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card className="p-6 glass-card">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-6">Focus Timer</h3>

        {selectedTask ? (
          <>
            {/* Task Info */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Focusing on:</p>
              <p className="font-medium text-foreground">{selectedTask.title}</p>
            </div>

            {/* Circular Progress */}
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-300",
                    isActive && !isPaused ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </svg>
              {/* Time display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(progress)}% complete
                  </div>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-3">
              {!isActive ? (
                <Button
                  onClick={handleStart}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Focus
                </Button>
              ) : isPaused ? (
                <Button onClick={handleResume} size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline" size="lg">
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}

              {(isActive || isPaused) && (
                <Button onClick={handleStop} variant="outline" size="lg">
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              )}

              <Button onClick={handleReset} variant="ghost" size="lg">
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </div>

            {/* Status */}
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {isActive && !isPaused && "Stay focused! You're doing great."}
                {isPaused && "Timer paused. Take a breath and resume when ready."}
                {!isActive && timeRemaining === duration * 60 && "Ready to start your focus session?"}
                {!isActive && timeRemaining < duration * 60 && timeRemaining > 0 && "Session stopped. Reset to start fresh."}
                {timeRemaining === 0 && "Great job! Focus session completed."}
              </p>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
              <Play className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium mb-2">Ready to Focus?</p>
            <p className="text-sm">Select a task from the list to begin your focus session.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FocusTimer;
