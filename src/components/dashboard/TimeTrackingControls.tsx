
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, TimerOff, Coffee, UtensilsCrossed } from "lucide-react";

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
  <div className="flex flex-col md:flex-row gap-4 items-center">
    <Input 
      placeholder="Optional notes" 
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      className="flex-grow"
    />
    {isClocked ? (
      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
        <Button 
          variant="destructive" 
          onClick={() => clockOut(notes)}
          className="w-full md:w-auto"
        >
          <TimerOff className="mr-2 h-4 w-4" /> Clock Out
        </Button>
        <Button
          variant="outline"
          onClick={() => handleBreak('Lunch')}
          className="w-full md:w-auto"
        >
          <UtensilsCrossed className="mr-2 h-4 w-4" /> Lunch Break
        </Button>
        <Button
          variant="outline"
          onClick={() => handleBreak('Coffee')}
          className="w-full md:w-auto"
        >
          <Coffee className="mr-2 h-4 w-4" /> Break
        </Button>
      </div>
    ) : (
      <Button 
        onClick={() => clockIn(notes)}
        className="w-full md:w-auto"
      >
        <Clock className="mr-2 h-4 w-4" /> Clock In
      </Button>
    )}
    {isClocked && (
      <div className="bg-muted p-3 rounded-md w-full md:w-auto">
        <p>Current Session: {elapsedTime} elapsed</p>
      </div>
    )}
  </div>
);

export default TimeTrackingControls;
