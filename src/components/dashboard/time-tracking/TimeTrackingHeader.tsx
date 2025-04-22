
import React from 'react';
import { Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TimeTrackingHeaderProps {
  targetWeeklyHours: number;
  totalTrackedHours: number;
  remainingHours: number;
  setTargetWeeklyHours: (hours: number) => void;
}

const TimeTrackingHeader: React.FC<TimeTrackingHeaderProps> = ({
  targetWeeklyHours,
  totalTrackedHours,
  remainingHours,
  setTargetWeeklyHours,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Target className="h-5 w-5 mr-2 text-muted-foreground" />
        <CardTitle>Weekly Target Hours</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
          <div className="flex items-center gap-2">
            <label htmlFor="target-hours" className="font-medium">Set Target:</label>
            <Input
              id="target-hours"
              type="number"
              min={0}
              max={168}
              step={0.25}
              style={{ width: 80 }}
              value={targetWeeklyHours}
              onChange={e => setTargetWeeklyHours(Number(e.target.value) || 0)}
            />
            <span className="ml-2 text-sm text-muted-foreground">hours/week</span>
          </div>
          <div className="flex-1 flex gap-4 flex-wrap mt-2 md:mt-0">
            <div>
              <span className="font-semibold">{totalTrackedHours}</span>{" "}
              <span className="text-muted-foreground text-sm">tracked</span>
            </div>
            <div>
              <span className="font-semibold">{remainingHours.toFixed(2)}</span>{" "}
              <span className="text-muted-foreground text-sm">remaining</span>
            </div>
            <div>
              <span className="font-semibold">{targetWeeklyHours}</span>{" "}
              <span className="text-muted-foreground text-sm">target</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeTrackingHeader;
