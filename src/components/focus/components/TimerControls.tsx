
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface TimerControlsProps {
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isActive,
  isPaused,
  timeRemaining,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset
}) => {
  return (
    <div className="flex justify-center gap-3">
      {!isActive ? (
        <Button
          onClick={onStart}
          size="lg"
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          disabled={timeRemaining === 0}
        >
          <Play className="h-5 w-5 mr-2" />
          Start Focus
        </Button>
      ) : isPaused ? (
        <Button onClick={onResume} size="lg">
          <Play className="h-5 w-5 mr-2" />
          Resume
        </Button>
      ) : (
        <Button onClick={onPause} variant="outline" size="lg">
          <Pause className="h-5 w-5 mr-2" />
          Pause
        </Button>
      )}

      {(isActive || isPaused) && (
        <Button onClick={onStop} variant="outline" size="lg">
          <Square className="h-5 w-5 mr-2" />
          Stop
        </Button>
      )}

      <Button 
        onClick={onReset} 
        variant="ghost" 
        size="lg"
        disabled={isActive && !isPaused}
      >
        <RotateCcw className="h-5 w-5 mr-2" />
        Reset
      </Button>
    </div>
  );
};

export default TimerControls;
