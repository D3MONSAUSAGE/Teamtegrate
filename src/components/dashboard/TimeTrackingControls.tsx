
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, TimerOff, Timer, Loader2, Play } from "lucide-react";
import BreakTracker from "./time/BreakTracker";

interface BreakState {
  isOnBreak: boolean;
  breakType?: string;
  breakStartTime?: Date;
  workSessionId?: string;
}

interface TimeTrackingControlsProps {
  notes: string;
  setNotes: (val: string) => void;
  isClocked: boolean;
  clockIn: (notes?: string) => void;
  clockOut: (notes?: string) => void;
  handleBreak: (breakType: string) => void;
  resumeFromBreak?: () => void;
  elapsedTime: string;
  breakElapsedTime?: string;
  totalWorkedMinutes?: number;
  breakState?: BreakState;
  isLoading?: boolean;
  isOnline?: boolean;
}

const TimeTrackingControls: React.FC<TimeTrackingControlsProps> = ({
  notes,
  setNotes,
  isClocked,
  clockIn,
  clockOut,
  handleBreak,
  resumeFromBreak,
  elapsedTime,
  breakElapsedTime = '00:00:00',
  totalWorkedMinutes = 0,
  breakState = { isOnBreak: false },
  isLoading = false,
  isOnline = true,
}) => {
  // Determine the current state for UI display
  const isActivelyWorking = isClocked && !breakState.isOnBreak;
  const isOnBreak = breakState.isOnBreak;
  const isCompletelyIdle = !isClocked && !isOnBreak;

  const renderMainButton = () => {
    if (isOnBreak) {
      return (
        <Button 
          onClick={resumeFromBreak}
          disabled={isLoading || !isOnline}
          className="interactive-button bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Resume from {breakState.breakType} Break
        </Button>
      );
    }

    if (isActivelyWorking) {
      return (
        <Button 
          variant="destructive" 
          onClick={() => clockOut(notes)}
          disabled={isLoading || !isOnline}
          className="interactive-button bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TimerOff className="mr-2 h-4 w-4" />
          )}
          Clock Out
        </Button>
      );
    }

    return (
      <Button 
        onClick={() => clockIn(notes)}
        disabled={isLoading || !isOnline}
        className="interactive-button bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-600 hover:to-lime-500 shadow-lg"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Clock className="mr-2 h-4 w-4" />
        )}
        Clock In
      </Button>
    );
  };

  const renderStatusCard = () => {
    if (isOnBreak) {
      return (
        <div className="glass-card p-4 rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/20 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="flex flex-col">
              <p className="text-sm font-medium text-foreground">
                On {breakState.breakType} Break: <span className="text-orange-600 font-bold">{breakElapsedTime}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Click "Resume" to continue your work session
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (isActivelyWorking) {
      return (
        <div className="glass-card p-4 rounded-xl border border-primary/20 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium text-foreground">
              Current Session: <span className="text-primary font-bold">{elapsedTime}</span> elapsed
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Time Tracking Controls */}
      <div className="modern-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
            <Timer className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Time Tracking
          </h3>
          {!isOnline && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full dark:bg-amber-900 dark:text-amber-200">
              Offline
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Input 
            placeholder="Add notes for your session..." 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-grow bg-white/50 dark:bg-input/50 backdrop-blur-sm border-border/60 focus:border-primary/60 transition-all duration-200"
            disabled={isLoading}
          />
          
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {renderMainButton()}
          </div>

          {renderStatusCard()}
        </div>
      </div>

      {/* Enhanced Break Tracker */}
      <BreakTracker
        totalWorkedMinutes={totalWorkedMinutes}
        onStartBreak={handleBreak}
        isOnBreak={isOnBreak}
        lastBreakType={breakState.breakType}
        breakStartTime={breakState.breakStartTime}
        isOnline={isOnline}
        isActivelyWorking={isActivelyWorking}
      />
    </div>
  );
};

export default TimeTrackingControls;
