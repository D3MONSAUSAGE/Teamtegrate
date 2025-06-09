
import { useRef, useCallback, useEffect } from 'react';

interface UseTimerIntervalProps {
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  timeRemainingRef: React.MutableRefObject<number>;
  lastTickTimeRef: React.MutableRefObject<number>;
  isCleanedUpRef: React.MutableRefObject<boolean>;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  onSessionComplete: () => void;
}

export const useTimerInterval = ({
  isActive,
  isPaused,
  timeRemaining,
  timeRemainingRef,
  lastTickTimeRef,
  isCleanedUpRef,
  setTimeRemaining,
  setIsActive,
  setIsPaused,
  onSessionComplete
}: UseTimerIntervalProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Comprehensive cleanup function
  const clearAllTimers = useCallback(() => {
    console.log('🧹 Clearing all timers');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    isCleanedUpRef.current = true;
  }, [isCleanedUpRef]);

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
  }, [clearAllTimers, onSessionComplete, timeRemainingRef, lastTickTimeRef, isCleanedUpRef, setTimeRemaining, setIsActive, setIsPaused]);

  // Main timer effect
  useEffect(() => {
    if (isActive && !isPaused && !isCleanedUpRef.current) {
      console.log('▶️ Starting timer loop');
      
      // Reset timing references when starting
      lastTickTimeRef.current = 0;
      timeRemainingRef.current = timeRemaining;
      
      // Use interval for consistent updates
      intervalRef.current = setInterval(tick, 1000);
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
  }, [isActive, isPaused, tick, timeRemaining, timeRemainingRef, lastTickTimeRef, isCleanedUpRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, final cleanup');
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return { clearAllTimers };
};
