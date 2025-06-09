
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, TimerOff, Coffee, UtensilsCrossed, Timer } from "lucide-react";

interface TimeTrackingControlsProps {
  notes: string;
  setNotes: (val: string) => void;
  isClocked: boolean;
  clockIn: (notes?: string) => void;
  clockOut: (notes?: string) => void;
  handleBreak: (breakType: string) => void;
  elapsedTime: string;
}

const TimeTrackingControls: React.FC<TimeTrackingControlsProps> = ({
  notes,
  setNotes,
  isClocked,
  clockIn,
  clockOut,
  handleBreak,
  elapsedTime,
}) => (
  <div className="modern-card p-6 space-y-4 animate-fade-in">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
        <Timer className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
        Time Tracking
      </h3>
    </div>

    <div className="flex flex-col gap-4">
      <Input 
        placeholder="Add notes for your session..." 
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="flex-grow bg-white/50 dark:bg-input/50 backdrop-blur-sm border-border/60 focus:border-primary/60 transition-all duration-200"
      />
      
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        {isClocked ? (
          <>
            <Button 
              variant="destructive" 
              onClick={() => clockOut(notes)}
              className="interactive-button bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
            >
              <TimerOff className="mr-2 h-4 w-4" /> 
              Clock Out
            </Button>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => handleBreak('Lunch')}
                className="interactive-button border-border/60 hover:border-primary/60 bg-white/50 dark:bg-card/50 backdrop-blur-sm"
              >
                <UtensilsCrossed className="mr-2 h-4 w-4" /> 
                Lunch Break
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBreak('Coffee')}
                className="interactive-button border-border/60 hover:border-primary/60 bg-white/50 dark:bg-card/50 backdrop-blur-sm"
              >
                <Coffee className="mr-2 h-4 w-4" /> 
                Coffee Break
              </Button>
            </div>
          </>
        ) : (
          <Button 
            onClick={() => clockIn(notes)}
            className="interactive-button bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-600 hover:to-lime-500 shadow-lg"
          >
            <Clock className="mr-2 h-4 w-4" /> 
            Clock In
          </Button>
        )}
      </div>

      {isClocked && (
        <div className="glass-card p-4 rounded-xl border border-primary/20 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium text-foreground">
              Current Session: <span className="text-primary font-bold">{elapsedTime}</span> elapsed
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default TimeTrackingControls;
