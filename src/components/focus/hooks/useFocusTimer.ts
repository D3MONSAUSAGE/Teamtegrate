
import { Task } from '@/types';
import { FocusSession } from '@/pages/FocusZonePage';
import { useTimerState } from './useTimerState';
import { useTimerInterval } from './useTimerInterval';
import { useSessionManagement } from './useSessionManagement';
import { useTimerControls } from './useTimerControls';
import { useTimerEffects } from './useTimerEffects';
import { useCallback } from 'react';

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
  const {
    timeRemaining,
    setTimeRemaining,
    isActive,
    setIsActive,
    isPaused,
    setIsPaused,
    startTime,
    setStartTime,
    pausedTime,
    setPausedTime,
    timeRemainingRef,
    lastTickTimeRef,
    isCleanedUpRef,
    progress
  } = useTimerState(duration);

  const { sessionId, setSessionId, generateSessionId } = useSessionManagement(selectedTask);

  const { clearAllTimers } = useTimerInterval({
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
  });

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
  }, [duration, clearAllTimers, setIsActive, setIsPaused, setTimeRemaining, timeRemainingRef, setSessionId, setStartTime, setPausedTime, isCleanedUpRef, lastTickTimeRef]);

  const {
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleReset
  } = useTimerControls({
    selectedTask,
    duration,
    sessionId,
    timeRemainingRef,
    lastTickTimeRef,
    isCleanedUpRef,
    setSessionId,
    setIsActive,
    setIsPaused,
    setTimeRemaining,
    setStartTime,
    setPausedTime,
    generateSessionId,
    clearAllTimers
  });

  useTimerEffects({
    selectedTask,
    duration,
    timeRemaining,
    isActive,
    isPaused,
    progress,
    sessionId,
    timeRemainingRef,
    isCleanedUpRef,
    setTimeRemaining,
    resetTimerState,
    onSessionUpdate
  });

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
