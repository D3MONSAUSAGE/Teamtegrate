
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
  
  // Refs for stable timing
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingRef = useRef<number>(duration * 60);
  const lastTickTimeRef = useRef<number>(0);
  const isCleanedUpRef = useRef(false);

  const totalSeconds = duration * 60;
  // Prevent division by zero and ensure valid progress
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(100, ((totalSeconds - timeRemaining) / totalSeconds) * 100)) : 0;

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const taskId = selectedTask?.id || 'unknown';
    return `${taskId}-${timestamp}-${random}`;
  }, [selectedTask?.id]);

  // Comprehensive cleanup function
  const clearAllTimers = useCallback(() => {
    console.log('🧹 Clearing all timers');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    isCleanedUpRef.current = true;
  }, []);

  // Stable tick function - no dependencies on changing state
  const tick = useCallback(() => {
    // Prevent execution after cleanup
    if (isCleanedUpRef.current) {
      console.log('⚠️ Tick called after cleanup, aborting');
      return;
    }

    const now = performance.now();
    
    // Initialize on first tick
    if (lastTickTimeRef.current === 0) {
      lastTickTimeRef.current = now;
      return;
    }

    // Calculate elapsed time in seconds
    const deltaMs = now - lastTickTimeRef.current;
    const deltaSeconds = deltaMs / 1000;
    
    // Update time remaining using ref
    timeRemainingRef.current = Math.max(0, timeRemainingRef.current - deltaSeconds);
    lastTickTimeRef.current = now;

    // Round to nearest second for display
    const newTimeRemaining = Math.max(0, Math.round(timeRemainingRef.current));

    setTimeRemaining(prev => {
      if (newTimeRemaining !== prev) {
        if (newTimeRemaining <= 0) {
          // Session completed
          setTimeout(() => {
            if (!isCleanedUpRef.current) {
              console.log('⏰ Timer completed, calling onSessionComplete');
              clearAllTimers();
              setIsActive(false);
              setIsPaused(false);
              setTimeRemaining(0);
              onSessionComplete();
            }
          }, 0);
          return 0;
        }
        return newTimeRemaining;
      }
      return prev;
    });
  }, [clearAllTimers, onSessionComplete]); // Removed timeRemaining dependency

  // Reset timer state
  const resetTimerState = useCallback(() => {
    console.log('🔄 Resetting timer state');
    clearAllTimers();
    setIsActive(false);
    setIsPaused(false);
    const newDuration = duration * 60;
    setTimeRemaining(newDuration);
    timeRemainingRef.current = newDuration;
    setSessionId(null);
    setStartTime(null);
    setPausedTime(0);
    isCleanedUpRef.current = false;
    lastTickTimeRef.current = 0;
  }, [duration, clearAllTimers]);

  // Handle duration changes properly
  useEffect(() => {
    // Only reset time remaining if not in an active session
    if (!isActive && !sessionId) {
      console.log('📏 Duration changed, updating timer');
      const newDuration = duration * 60;
      setTimeRemaining(newDuration);
      timeRemainingRef.current = newDuration;
    }
    // If duration is changed during active session, warn but don't change timer
    else if (isActive && timeRemaining > duration * 60) {
      console.warn('⚠️ Duration changed during active session - timer will continue with original duration');
    }
  }, [duration, isActive, sessionId, timeRemaining]);

  // Main timer effect - FIXED: removed tick and timeRemaining dependencies
  useEffect(() => {
    if (isActive && !isPaused && !isCleanedUpRef.current) {
      console.log('▶️ Starting timer loop');
      
      // Reset timing references when starting
      lastTickTimeRef.current = 0;
      timeRemainingRef.current = timeRemaining;
      
      // Use interval for consistent updates
      intervalRef.current = setInterval(tick, 1000); // Changed to 1 second for cleaner timing
    } else {
      if (intervalRef.current) {
        console.log('⏸️ Stopping timer loop');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on effect dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused, tick]); // Removed timeRemaining dependency

  // Task change effect
  useEffect(() => {
    if (!selectedTask) {
      console.log('🚫 No task selected, resetting timer');
      resetTimerState();
    } else if (selectedTask && !sessionId && !isActive) {
      // Reset only if switching tasks while not active
      console.log('🔄 Task changed while not active, resetting timer');
      resetTimerState();
    }
  }, [selectedTask?.id, sessionId, isActive, resetTimerState]);

  // Session update effect
  useEffect(() => {
    if (selectedTask && sessionId && !isCleanedUpRef.current) {
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

  // Page visibility handling for cleanup
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        console.log('👁️ Page hidden, pausing timer to prevent issues');
        setIsPaused(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, final cleanup');
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Timer control handlers
  const handleStart = () => {
    if (!selectedTask) {
      console.warn('⚠️ Cannot start timer without selected task');
      return;
    }
    
    console.log('▶️ Starting focus session');
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setIsActive(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setPausedTime(0);
    isCleanedUpRef.current = false;
  };

  const handlePause = () => {
    console.log('⏸️ Pausing focus session');
    setIsPaused(true);
    setPausedTime(prev => prev + (Date.now() - (startTime || Date.now())));
  };

  const handleResume = () => {
    console.log('▶️ Resuming focus session');
    setIsPaused(false);
    setStartTime(Date.now());
    isCleanedUpRef.current = false;
  };

  const handleStop = () => {
    console.log('⏹️ Stopping focus session');
    clearAllTimers();
    setIsActive(false);
    setIsPaused(false);
    const resetDuration = duration * 60;
    setTimeRemaining(resetDuration);
    timeRemainingRef.current = resetDuration;
    setSessionId(null);
    setStartTime(null);
    setPausedTime(0);
    isCleanedUpRef.current = false;
    lastTickTimeRef.current = 0;
  };

  const handleReset = () => {
    console.log('🔄 Resetting focus timer');
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
