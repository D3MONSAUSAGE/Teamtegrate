
import { useState, useRef } from 'react';

export const useTimerState = (duration: number) => {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState<number>(0);
  
  // Refs for stable timing
  const timeRemainingRef = useRef<number>(duration * 60);
  const lastTickTimeRef = useRef<number>(0);
  const isCleanedUpRef = useRef(false);

  const totalSeconds = duration * 60;
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(100, ((totalSeconds - timeRemaining) / totalSeconds) * 100)) : 0;

  return {
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
  };
};
