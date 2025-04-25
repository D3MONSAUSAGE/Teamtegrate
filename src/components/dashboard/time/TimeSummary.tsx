
import React from 'react';
import { formatHoursMinutes } from '@/utils/timeUtils';

interface TimeSummaryProps {
  totalMinutes: number;
  bonusMinutes: number;
  totalWithBonus: number;
}

const TimeSummary: React.FC<TimeSummaryProps> = ({ 
  totalMinutes, 
  bonusMinutes, 
  totalWithBonus 
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Worked Time:</span>
        <span className="font-medium">{formatHoursMinutes(totalMinutes)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Bonus Time:</span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">{bonusMinutes} minutes</span>
      </div>
      <div className="flex justify-between text-sm border-t pt-1">
        <span className="font-medium">Total Time:</span>
        <span className="font-bold">{formatHoursMinutes(totalWithBonus)}</span>
      </div>
    </div>
  );
};

export default TimeSummary;
