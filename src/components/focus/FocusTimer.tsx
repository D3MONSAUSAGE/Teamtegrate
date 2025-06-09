
import React from 'react';
import { Task } from '@/types';
import { FocusSession } from '@/pages/FocusZonePage';
import { Card } from '@/components/ui/card';
import { useFocusTimer } from './hooks/useFocusTimer';
import TaskInfo from './components/TaskInfo';
import TimerProgress from './components/TimerProgress';
import TimerControls from './components/TimerControls';
import TimerStatus from './components/TimerStatus';
import TimerEmptyState from './components/TimerEmptyState';

interface FocusTimerProps {
  selectedTask: Task | null;
  duration: number; // in minutes
  onSessionUpdate: (session: FocusSession) => void;
  onSessionComplete: () => void;
}

const FocusTimer: React.FC<FocusTimerProps> = ({
  selectedTask,
  duration,
  onSessionUpdate,
  onSessionComplete
}) => {
  const {
    timeRemaining,
    isActive,
    isPaused,
    progress,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleReset
  } = useFocusTimer({
    selectedTask,
    duration,
    onSessionUpdate,
    onSessionComplete
  });

  return (
    <Card className="p-6 glass-card">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-6">Focus Timer</h3>

        {selectedTask ? (
          <>
            <TaskInfo selectedTask={selectedTask} />
            
            <TimerProgress
              timeRemaining={timeRemaining}
              progress={progress}
              isActive={isActive}
              isPaused={isPaused}
            />

            <TimerControls
              isActive={isActive}
              isPaused={isPaused}
              timeRemaining={timeRemaining}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onReset={handleReset}
            />

            <TimerStatus
              selectedTask={selectedTask}
              timeRemaining={timeRemaining}
              isActive={isActive}
              isPaused={isPaused}
              duration={duration}
            />
          </>
        ) : (
          <TimerEmptyState />
        )}
      </div>
    </Card>
  );
};

export default FocusTimer;
