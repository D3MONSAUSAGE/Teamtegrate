
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
        {/* Progress circle */}
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
            "transition-all duration-300",
            isActive && !isPaused ? "text-primary" : "text-muted-foreground"
          )}
        />
      </svg>
      {/* Time display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold font-mono">
            {formatTime(timeRemaining)}
          </div>
          <div className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerProgress;
