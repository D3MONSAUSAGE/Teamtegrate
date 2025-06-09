
import { useState, useEffect, useRef, useCallback } from 'react';
import { Task } from '@/types';
import { FocusSession } from '@/pages/FocusZonePage';

interface UseFocusTimerProps {
  selectedTask: Task | null;
  duration: number;
  onSessionUpdate: (session: FocusSession) => void;
  onSessionComplete: () => void;
}

export const useFocusTimer = ({
  selectedTask,
  duration,
  onSessionUpdate,
  onSessionComplete
}: UseFocusTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
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
    if (!isActive || !selectedTask) {
      setTimeRemaining(duration * 60);
    }
  }, [duration, isActive, selectedTask]);

  // Reset when task changes
  useEffect(() => {
    if (!selectedTask) {
      resetTimerState();
    } else if (selectedTask && !sessionId) {
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

  return {
    timeRemaining,
    isActive,
    isPaused,
    progress,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleReset
  };
};
