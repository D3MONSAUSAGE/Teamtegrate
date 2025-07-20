
import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  variant?: 'work' | 'break' | 'paused' | 'default';
  animated?: boolean;
  pulsing?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress = 0,
  size = 120,
  strokeWidth = 8,
  className,
  children,
  variant = 'default',
  animated = true,
  pulsing = false
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  const getVariantColors = () => {
    switch (variant) {
      case 'work':
        return {
          track: 'stroke-green-200 dark:stroke-green-900',
          progress: 'stroke-green-500 dark:stroke-green-400',
          glow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]'
        };
      case 'break':
        return {
          track: 'stroke-orange-200 dark:stroke-orange-900',
          progress: 'stroke-orange-500 dark:stroke-orange-400',
          glow: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]'
        };
      case 'paused':
        return {
          track: 'stroke-yellow-200 dark:stroke-yellow-900',
          progress: 'stroke-yellow-500 dark:stroke-yellow-400',
          glow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]'
        };
      default:
        return {
          track: 'stroke-muted-foreground/20',
          progress: 'stroke-primary',
          glow: 'drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]'
        };
    }
  };

  const colors = getVariantColors();

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className={cn(
          "transform -rotate-90 transition-all duration-300",
          pulsing && "animate-pulse",
          animated && colors.glow
        )}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("transition-colors duration-300", colors.track)}
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-500 ease-out",
            colors.progress,
            animated && "animate-[progress-draw_0.5s_ease-out]"
          )}
          style={{
            filter: pulsing ? 'brightness(1.2)' : 'none'
          }}
        />
      </svg>
      
      {/* Content in center */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default CircularProgress;

