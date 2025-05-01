
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar } from 'lucide-react';
import { parseISO, differenceInMinutes, format, isToday } from 'date-fns';
import { calculateBonusMinutes } from '@/utils/timeUtils';
import { calculateBreakRequirements } from '@/utils/breakTracking';
import TimeSummary from './time/TimeSummary';
import TimeDetailsRow from './time/TimeDetailsRow';
import BreakRequirementsAlert from './time/BreakRequirementsAlert';

interface DailyTimeReportProps {
  entries: Array<{
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  }>;
  selectedDate?: Date;
}

const DailyTimeReport: React.FC<DailyTimeReportProps> = ({ entries, selectedDate = new Date() }) => {
  const totalMinutes = entries.reduce((total, entry) => {
    if (entry.duration_minutes) {
      return total + entry.duration_minutes;
    } else if (entry.clock_out) {
      const minutesDiff = differenceInMinutes(
        parseISO(entry.clock_out),
        parseISO(entry.clock_in)
      );
      return total + minutesDiff;
    }
    return total;
  }, 0);

  const bonusMinutes = calculateBonusMinutes(totalMinutes);
  const totalWithBonus = totalMinutes + bonusMinutes;
  const { mealBreaks, restBreaks } = calculateBreakRequirements(totalMinutes);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {isToday(selectedDate) ? 'Today\'s Time Report' : (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(selectedDate, 'MMMM d, yyyy')}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <TimeSummary 
            totalMinutes={totalMinutes} 
            bonusMinutes={bonusMinutes} 
            totalWithBonus={totalWithBonus} 
          />
          
          <BreakRequirementsAlert
            mealBreaks={mealBreaks}
            restBreaks={restBreaks}
            totalMinutes={totalMinutes}
          />

          <div className="space-y-1 mt-3">
            {entries.length > 0 ? (
              entries.map((entry, index) => (
                <TimeDetailsRow key={index} entry={entry} />
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No time entries for this day
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTimeReport;
