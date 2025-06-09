
import React from 'react';
import { cn } from '@/lib/utils';

interface TimerProgressProps {
  timeRemaining: number;
  progress: number;
  isActive: boolean;
  isPaused: boolean;
}

const TimerProgress: React.FC<TimerProgressProps> = ({
  timeRemaining,
  progress,
  isActive,
  isPaused
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  // Ensure progress is always valid (0-100)
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  // Determine the visual state for styling
  const getTimerState = () => {
    if (!isActive) return 'ready';
    if (isPaused) return 'paused';
    return 'active';
  };

  const timerState = getTimerState();

  return (
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
        {/* Progress circle with smooth transitions */}
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
            "transition-all duration-300 ease-out",
            timerState === 'active' && "text-primary animate-pulse",
            timerState === 'paused' && "text-yellow-500",
            timerState === 'ready' && "text-muted-foreground"
          )}
          style={{
            // Smooth transition for stroke dash offset
            transitionProperty: 'stroke-dashoffset, color',
            transitionDuration: '0.3s',
            transitionTimingFunction: 'ease-out'
          }}
        />
      </svg>
      
      {/* Time display with enhanced styling */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={cn(
            "text-2xl font-bold font-mono transition-colors duration-300",
            timerState === 'active' && "text-primary",
            timerState === 'paused' && "text-yellow-600",
            timerState === 'ready' && "text-foreground"
          )}>
            {formatTime(timeRemaining)}
          </div>
          
          <div className="text-xs text-muted-foreground mt-1">
            {safeProgress}% complete
          </div>
          
          {/* Status indicator */}
          <div className={cn(
            "text-xs mt-1 font-medium transition-colors duration-300",
            timerState === 'active' && "text-primary",
            timerState === 'paused' && "text-yellow-600",
            timerState === 'ready' && "text-muted-foreground"
          )}>
            {timerState === 'active' && '🎯 Focusing'}
            {timerState === 'paused' && '⏸️ Paused'}
            {timerState === 'ready' && '⭐ Ready'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerProgress;
