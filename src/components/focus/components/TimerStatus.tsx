
import React from 'react';
import { Task } from '@/types';

interface TimerStatusProps {
  selectedTask: Task;
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  duration: number;
}

const TimerStatus: React.FC<TimerStatusProps> = ({
  selectedTask,
  timeRemaining,
  isActive,
  isPaused,
  duration
}) => {
  const getStatusMessage = () => {
    if (!selectedTask) return "";
    if (timeRemaining === 0) return "Great job! Focus session completed.";
    if (isActive && !isPaused) return "Stay focused! You're doing great.";
    if (isPaused) return "Timer paused. Take a breath and resume when ready.";
    if (!isActive && timeRemaining === duration * 60) return "Ready to start your focus session?";
    if (!isActive && timeRemaining < duration * 60 && timeRemaining > 0) return "Session stopped. Reset to start fresh.";
    return "";
  };

  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">
        {getStatusMessage()}
      </p>
    </div>
  );
};

export default TimerStatus;
