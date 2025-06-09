import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  const totalSeconds = duration * 60;
  const progress = Math.max(0, Math.min(100, ((totalSeconds - timeRemaining) / totalSeconds) * 100));

  // Clear interval helper
  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset timer state
  const resetTimerState = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(duration * 60);
    setSessionId(null);
    clearTimerInterval();
  }, [duration, clearTimerInterval]);

  // Handle session completion
  const handleComplete = useCallback(() => {
    clearTimerInterval();
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(0);
    onSessionComplete();
  }, [clearTimerInterval, onSessionComplete]);

  // Timer tick function with better accuracy
  const tick = useCallback(() => {
    const now = Date.now();
    const deltaTime = Math.round((now - lastTickRef.current) / 1000);
    lastTickRef.current = now;

    setTimeRemaining((prev) => {
      const newTime = Math.max(0, prev - deltaTime);
      if (newTime <= 0) {
        // Use setTimeout to prevent calling handleComplete during render
        setTimeout(handleComplete, 0);
        return 0;
      }
      return newTime;
    });
  }, [handleComplete]);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearTimerInterval();
    }

    return clearTimerInterval;
  }, [isActive, isPaused, timeRemaining, tick, clearTimerInterval]);

  // Handle duration changes
  useEffect(() => {
    // Only reset if timer is not active or if task changed
    if (!isActive || !selectedTask) {
      setTimeRemaining(duration * 60);
    }
    // If timer is active and duration changed, ask user what to do
    // For now, we'll keep the current session running
  }, [duration, isActive, selectedTask]);

  // Reset when task changes
  useEffect(() => {
    if (!selectedTask) {
      resetTimerState();
    } else if (selectedTask && !sessionId) {
      // New task selected, reset timer
      resetTimerState();
    }
  }, [selectedTask, sessionId, resetTimerState]);

  // Update parent with session state
  useEffect(() => {
    if (selectedTask && sessionId) {
      const session: FocusSession = {
        id: sessionId,
        taskId: selectedTask.id,
        duration: duration * 60,
        timeRemaining,
        isActive,
        isPaused,
        progress
      };
      onSessionUpdate(session);
    }
  }, [selectedTask, sessionId, timeRemaining, isActive, isPaused, progress, duration, onSessionUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, [clearTimerInterval]);

  const handleStart = () => {
    if (!selectedTask) return;
    
    const newSessionId = `${selectedTask.id}-${Date.now()}`;
    setSessionId(newSessionId);
    setIsActive(true);
    setIsPaused(false);
    lastTickRef.current = Date.now();
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    lastTickRef.current = Date.now();
  };

  const handleStop = () => {
    clearTimerInterval();
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(duration * 60);
    setSessionId(null);
  };

  const handleReset = () => {
    resetTimerState();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getStatusMessage = () => {
    if (!selectedTask) return "";
    if (timeRemaining === 0) return "Great job! Focus session completed.";
    if (isActive && !isPaused) return "Stay focused! You're doing great.";
    if (isPaused) return "Timer paused. Take a breath and resume when ready.";
    if (!isActive && timeRemaining === duration * 60) return "Ready to start your focus session?";
    if (!isActive && timeRemaining < duration * 60 && timeRemaining > 0) return "Session stopped. Reset to start fresh.";
    return "";
  };

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
                  disabled={timeRemaining === 0}
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

              <Button 
                onClick={handleReset} 
                variant="ghost" 
                size="lg"
                disabled={isActive && !isPaused}
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </div>

            {/* Status */}
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {getStatusMessage()}
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
