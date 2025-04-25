
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from 'lucide-react';
import { parseISO, differenceInMinutes } from 'date-fns';
import { calculateBreakRequirements } from '@/utils/breakTracking';
import TimeSummary from './TimeSummary';
import TimeDetailsRow from './TimeDetailsRow';
import BreakRequirementsAlert from './BreakRequirementsAlert';

interface DailyTimeReportProps {
  entries: Array<{
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  }>;
}

const DailyTimeReport: React.FC<DailyTimeReportProps> = ({ entries }) => {
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

  const { mealBreaks, restBreaks } = calculateBreakRequirements(totalMinutes);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Today's Time Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <TimeSummary totalMinutes={totalMinutes} />
          
          <BreakRequirementsAlert
            mealBreaks={mealBreaks}
            restBreaks={restBreaks}
            totalMinutes={totalMinutes}
          />

          <div className="space-y-1 mt-3">
            {entries.map((entry, index) => (
              <TimeDetailsRow key={index} entry={entry} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTimeReport;
