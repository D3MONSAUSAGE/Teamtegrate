
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseISO, differenceInMinutes } from 'date-fns';
import { FileText } from 'lucide-react';
import { formatTime12Hour, calculateBonusMinutes, formatHoursMinutes } from '@/utils/timeUtils';

interface DailyTimeReportProps {
  entries: Array<{
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  }>;
}

const DailyTimeReport: React.FC<DailyTimeReportProps> = ({ entries }) => {
  // Calculate total duration from all entries
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

  // Add bonus minutes based on total time worked
  const bonusMinutes = calculateBonusMinutes(totalMinutes);
  const totalWithBonus = totalMinutes + bonusMinutes;
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Today's Time Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
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
          <div className="space-y-1 mt-3">
            {entries.map((entry, index) => {
              let durationMinutes = entry.duration_minutes || 0;
              if (!durationMinutes && entry.clock_out) {
                durationMinutes = differenceInMinutes(
                  parseISO(entry.clock_out),
                  parseISO(entry.clock_in)
                );
              }
              
              return (
                <div key={index} className="text-xs text-muted-foreground">
                  {formatTime12Hour(entry.clock_in)} - {' '}
                  {entry.clock_out ? formatTime12Hour(entry.clock_out) : 'ongoing'}
                  {durationMinutes > 0 && entry.clock_out && (
                    <span className="ml-1">• {formatHoursMinutes(durationMinutes)}</span>
                  )}
                  {entry.notes && <span className="ml-1">• {entry.notes}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTimeReport;
