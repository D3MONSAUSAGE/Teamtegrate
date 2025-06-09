
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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState<number>(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  const totalSeconds = duration * 60;
  const progress = Math.max(0, Math.min(100, ((totalSeconds - timeRemaining) / totalSeconds) * 100));

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const taskId = selectedTask?.id || 'unknown';
    return `${taskId}-${timestamp}-${random}`;
  }, [selectedTask?.id]);

  // Clear all timer references
  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // More accurate timer tick using performance.now()
  const tick = useCallback(() => {
    const now = performance.now();
    const deltaTime = Math.round((now - lastUpdateRef.current) / 1000);
    lastUpdateRef.current = now;

    setTimeRemaining((prev) => {
      const newTime = Math.max(0, prev - deltaTime);
      if (newTime <= 0) {
        // Use setTimeout to avoid state update during render
        setTimeout(() => {
          clearAllTimers();
          setIsActive(false);
          setIsPaused(false);
          setTimeRemaining(0);
          onSessionComplete();
        }, 0);
        return 0;
      }
      return newTime;
    });
  }, [clearAllTimers, onSessionComplete]);

  // Reset timer state
  const resetTimerState = useCallback(() => {
    clearAllTimers();
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(duration * 60);
    setSessionId(null);
    setStartTime(null);
    setPausedTime(0);
  }, [duration, clearAllTimers]);

  // Handle duration changes properly
  useEffect(() => {
    // Only reset time remaining if not in an active session
    if (!isActive && !sessionId) {
      setTimeRemaining(duration * 60);
    }
    // If duration is changed during active session, warn user but don't change timer
    else if (isActive && timeRemaining > duration * 60) {
      console.warn('Duration changed during active session - timer will continue with original duration');
    }
  }, [duration, isActive, sessionId, timeRemaining]);

  // Timer management effect
  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      lastUpdateRef.current = performance.now();
      intervalRef.current = setInterval(tick, 100); // More frequent updates for accuracy
    } else {
      clearAllTimers();
    }

    return clearAllTimers;
  }, [isActive, isPaused, timeRemaining, tick, clearAllTimers]);

  // Reset when task changes (but only if no active session)
  useEffect(() => {
    if (!selectedTask) {
      resetTimerState();
    } else if (selectedTask && !sessionId && !isActive) {
      // Reset only if switching tasks while not active
      resetTimerState();
    }
  }, [selectedTask?.id, sessionId, isActive, resetTimerState]);

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
        progress: Math.round(progress)
      };
      onSessionUpdate(session);
    }
  }, [selectedTask, sessionId, timeRemaining, isActive, isPaused, progress, duration, onSessionUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const handleStart = () => {
    if (!selectedTask) return;
    
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setIsActive(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setPausedTime(0);
    lastUpdateRef.current = performance.now();
  };

  const handlePause = () => {
    setIsPaused(true);
    setPausedTime(prev => prev + (Date.now() - (startTime || Date.now())));
  };

  const handleResume = () => {
    setIsPaused(false);
    setStartTime(Date.now());
    lastUpdateRef.current = performance.now();
  };

  const handleStop = () => {
    clearAllTimers();
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(duration * 60);
    setSessionId(null);
    setStartTime(null);
    setPausedTime(0);
  };

  const handleReset = () => {
    resetTimerState();
  };

  return {
    timeRemaining,
    isActive,
    isPaused,
    progress: Math.round(progress),
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleReset
  };
};
