
import { useEffect, useRef } from 'react';
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
  // Track the last task ID to detect actual task changes
  const lastTaskIdRef = useRef<string | null>(null);
  const lastDurationRef = useRef<number>(duration);

  // Handle duration changes properly - only reset if not in active session
  useEffect(() => {
    console.log('⚙️ Duration effect triggered:', { 
      duration, 
      lastDuration: lastDurationRef.current, 
      isActive, 
      sessionId 
    });
    
    // Only reset time remaining if:
    // 1. Duration actually changed
    // 2. Not in an active session
    // 3. Not currently running
    if (duration !== lastDurationRef.current && !isActive && !sessionId) {
      console.log('📏 Duration changed while not active, updating timer');
      const newDuration = duration * 60;
      setTimeRemaining(newDuration);
      timeRemainingRef.current = newDuration;
      lastDurationRef.current = duration;
    } else if (duration !== lastDurationRef.current && isActive) {
      console.warn('⚠️ Duration changed during active session - keeping current timer');
      lastDurationRef.current = duration; // Update ref to prevent future warnings
    } else if (duration === lastDurationRef.current) {
      // Duration didn't actually change, no action needed
      console.log('📏 Duration effect triggered but value unchanged');
    }
  }, [duration, isActive, sessionId, timeRemaining, setTimeRemaining, timeRemainingRef]);

  // Task change effect - much smarter detection
  useEffect(() => {
    const currentTaskId = selectedTask?.id || null;
    
    console.log('🎯 Task effect triggered:', { 
      currentTaskId, 
      lastTaskId: lastTaskIdRef.current, 
      isActive, 
      sessionId,
      hasTask: !!selectedTask 
    });

    // Case 1: No task selected - reset if not in session
    if (!selectedTask) {
      if (!sessionId) {
        console.log('🚫 No task selected and no session, resetting timer');
        resetTimerState();
      } else {
        console.log('🚫 No task selected but session exists, keeping timer');
      }
      lastTaskIdRef.current = null;
      return;
    }

    // Case 2: Task ID actually changed - be careful about resetting during active sessions
    if (currentTaskId !== lastTaskIdRef.current) {
      console.log('🔄 Task ID changed:', { 
        from: lastTaskIdRef.current, 
        to: currentTaskId,
        isActive,
        sessionId 
      });
      
      // Only reset if not in an active session
      if (!isActive && !sessionId) {
        console.log('🔄 Task changed while not active, resetting timer');
        resetTimerState();
      } else {
        console.warn('⚠️ Task changed during active session - keeping current timer running');
        // Update the ref but don't reset the timer
      }
      lastTaskIdRef.current = currentTaskId;
    } else {
      // Same task ID - no reset needed, just log
      console.log('🎯 Same task selected, no reset needed');
    }
  }, [selectedTask?.id, sessionId, isActive, resetTimerState]);

  // Session update effect - only when we have an active session
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
      
      console.log('📊 Updating session:', {
        sessionId,
        taskId: selectedTask.id,
        timeRemaining,
        progress: Math.round(progress),
        isActive,
        isPaused
      });
      
      onSessionUpdate(session);
    }
  }, [selectedTask, sessionId, timeRemaining, isActive, isPaused, progress, duration, onSessionUpdate, isCleanedUpRef]);

  // Initialize refs on mount
  useEffect(() => {
    lastTaskIdRef.current = selectedTask?.id || null;
    lastDurationRef.current = duration;
    console.log('🚀 Timer effects initialized:', {
      taskId: selectedTask?.id,
      duration
    });
  }, []); // Only run on mount
};
