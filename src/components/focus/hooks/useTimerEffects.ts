
import { useEffect } from 'react';
import { Task } from '@/types';
import { FocusSession } from '@/pages/FocusZonePage';

interface UseTimerEffectsProps {
  selectedTask: Task | null;
  duration: number;
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  progress: number;
  sessionId: string | null;
  timeRemainingRef: React.MutableRefObject<number>;
  isCleanedUpRef: React.MutableRefObject<boolean>;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  resetTimerState: () => void;
  onSessionUpdate: (session: FocusSession) => void;
}

export const useTimerEffects = ({
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
}: UseTimerEffectsProps) => {

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
  }, [duration, isActive, sessionId, timeRemaining, setTimeRemaining, timeRemainingRef]);

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
  }, [selectedTask, sessionId, timeRemaining, isActive, isPaused, progress, duration, onSessionUpdate, isCleanedUpRef]);

  // Page visibility handling for cleanup
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        console.log('👁️ Page hidden, pausing timer to prevent issues');
        // Note: This would need to be passed in if we want to pause on visibility change
        // setPaused(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);
};
