
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimeTrackingSummaryProps {
  targetWeeklyHours: number;
  setTargetWeeklyHours: (val: number) => void;
  totalTrackedHours: number;
  remainingHours: number;
}

const TimeTrackingSummary: React.FC<TimeTrackingSummaryProps> = ({
  targetWeeklyHours,
  setTargetWeeklyHours,
  totalTrackedHours,
  remainingHours,
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center gap-2">
      <Target className="h-5 w-5 mr-2 text-muted-foreground" />
      <CardTitle>Weekly Target Hours</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="target-hours" className="font-medium">Set Target:</label>
          <input
            id="target-hours"
            type="number"
            min={0}
            max={168}
            step={0.25}
            style={{ width: 80 }}
            value={targetWeeklyHours}
            onChange={e => setTargetWeeklyHours(Number(e.target.value) || 0)}
            className="border rounded px-2 py-1"
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

export default TimeTrackingSummary;
