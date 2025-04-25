
import React from 'react';
import { formatHoursMinutes } from '@/utils/timeUtils';
import { calculateBreakRequirements } from '@/utils/breakTracking';

interface TimeSummaryProps {
  totalMinutes: number;
  bonusMinutes?: number;
  totalWithBonus?: number;
}

const TimeSummary: React.FC<TimeSummaryProps> = ({ 
  totalMinutes,
  bonusMinutes,
  totalWithBonus 
}) => {
  const { earnedBreakMinutes } = calculateBreakRequirements(totalMinutes);
  const finalTotal = totalWithBonus || (totalMinutes + earnedBreakMinutes);

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
      {bonusMinutes !== undefined && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Bonus Time:</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">{bonusMinutes} minutes</span>
        </div>
      )}
      <div className="flex justify-between text-sm border-t pt-1">
        <span className="font-medium">Total Time:</span>
        <span className="font-bold">{formatHoursMinutes(finalTotal)}</span>
      </div>
    </div>
  );
};

export default TimeSummary;
