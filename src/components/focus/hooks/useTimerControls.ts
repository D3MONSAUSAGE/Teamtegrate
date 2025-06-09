
import { useCallback } from 'react';
import { Task } from '@/types';

interface UseTimerControlsProps {
  selectedTask: Task | null;
  duration: number;
  sessionId: string | null;
  timeRemainingRef: React.MutableRefObject<number>;
  lastTickTimeRef: React.MutableRefObject<number>;
  isCleanedUpRef: React.MutableRefObject<boolean>;
  setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  setStartTime: React.Dispatch<React.SetStateAction<number | null>>;
  setPausedTime: React.Dispatch<React.SetStateAction<number>>;
  generateSessionId: () => string;
  clearAllTimers: () => void;
}

export const useTimerControls = ({
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
}: UseTimerControlsProps) => {

  const handleStart = useCallback(() => {
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
    
    // Ensure timer starts with correct duration
    const startDuration = duration * 60;
    setTimeRemaining(startDuration);
    timeRemainingRef.current = startDuration;
  }, [selectedTask, generateSessionId, setSessionId, setIsActive, setIsPaused, setStartTime, setPausedTime, isCleanedUpRef, duration, setTimeRemaining, timeRemainingRef]);

  const handlePause = useCallback(() => {
    console.log('⏸️ Pausing focus session');
    setIsPaused(true);
  }, [setIsPaused]);

  const handleResume = useCallback(() => {
    console.log('▶️ Resuming focus session');
    setIsPaused(false);
    setStartTime(Date.now());
    isCleanedUpRef.current = false;
  }, [setIsPaused, setStartTime, isCleanedUpRef]);

  const handleStop = useCallback(() => {
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
  }, [clearAllTimers, duration, setIsActive, setIsPaused, setTimeRemaining, timeRemainingRef, setSessionId, setStartTime, setPausedTime, isCleanedUpRef, lastTickTimeRef]);

  const handleReset = useCallback(() => {
    console.log('🔄 Resetting focus timer');
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
  }, [clearAllTimers, duration, setIsActive, setIsPaused, setTimeRemaining, timeRemainingRef, setSessionId, setStartTime, setPausedTime, isCleanedUpRef, lastTickTimeRef]);

  return {
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleReset
  };
};
