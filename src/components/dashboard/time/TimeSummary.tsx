
import React from 'react';
import { formatHoursMinutes } from '@/utils/timeUtils';
import { calculateBreakRequirements } from '@/utils/breakTracking';

interface TimeSummaryProps {
  totalMinutes: number;
}

const TimeSummary: React.FC<TimeSummaryProps> = ({ totalMinutes }) => {
  const { earnedBreakMinutes } = calculateBreakRequirements(totalMinutes);
  const totalWithBreaks = totalMinutes + earnedBreakMinutes;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Worked Time:</span>
        <span className="font-medium">{formatHoursMinutes(totalMinutes)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Break Time Earned:</span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">{earnedBreakMinutes} minutes</span>
      </div>
      <div className="flex justify-between text-sm border-t pt-1">
        <span className="font-medium">Total Time:</span>
        <span className="font-bold">{formatHoursMinutes(totalWithBreaks)}</span>
      </div>
    </div>
  );
};

export default TimeSummary;
