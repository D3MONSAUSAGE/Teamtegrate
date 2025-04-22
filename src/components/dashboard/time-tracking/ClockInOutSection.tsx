
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, TimerOff, UtensilsCrossed, Coffee } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ClockInOutSectionProps {
  notes: string;
  setNotes: (notes: string) => void;
  isClocked: boolean;
  elapsedTime: string;
  onClockIn: (notes: string) => void;
  onClockOut: (notes: string) => void;
  onBreak: (breakType: string) => void;
}

const ClockInOutSection: React.FC<ClockInOutSectionProps> = ({
  notes,
  setNotes,
  isClocked,
  elapsedTime,
  onClockIn,
  onClockOut,
  onBreak,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                onClick={() => onClockOut(notes)}
                className="w-full md:w-auto"
              >
                <TimerOff className="mr-2 h-4 w-4" /> Clock Out
              </Button>
              <Button
                variant="outline"
                onClick={() => onBreak('Lunch')}
                className="w-full md:w-auto"
              >
                <UtensilsCrossed className="mr-2 h-4 w-4" /> Lunch Break
              </Button>
              <Button
                variant="outline"
                onClick={() => onBreak('Coffee')}
                className="w-full md:w-auto"
              >
                <Coffee className="mr-2 h-4 w-4" /> Break
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => onClockIn(notes)}
              className="w-full md:w-auto"
            >
              <Clock className="mr-2 h-4 w-4" /> Clock In
            </Button>
          )}
        </div>
        {isClocked && (
          <div className="bg-muted p-3 rounded-md">
            <p>Current Session: {elapsedTime} elapsed</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClockInOutSection;
