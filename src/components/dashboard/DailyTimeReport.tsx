
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { FileText } from 'lucide-react';

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
      // If we already have duration_minutes, use that
      return total + entry.duration_minutes;
    } else if (entry.clock_out) {
      // If we have clock_out but no duration, calculate it
      const minutesDiff = differenceInMinutes(
        parseISO(entry.clock_out),
        parseISO(entry.clock_in)
      );
      return total + minutesDiff;
    }
    return total;
  }, 0);

  // Calculate total hours from minutes
  const totalHours = totalMinutes / 60;
  
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
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Hours:</span>
            <span className="font-medium">{totalHours.toFixed(2)}h</span>
          </div>
          <div className="space-y-1">
            {entries.length === 0 ? (
              <div className="text-xs text-muted-foreground">No entries for today</div>
            ) : (
              entries.map((entry, index) => {
                // Calculate duration for this entry
                let durationMinutes = entry.duration_minutes || 0;
                if (!durationMinutes && entry.clock_out) {
                  durationMinutes = differenceInMinutes(
                    parseISO(entry.clock_out),
                    parseISO(entry.clock_in)
                  );
                }
                
                return (
                  <div key={index} className="text-xs text-muted-foreground">
                    {format(parseISO(entry.clock_in), 'HH:mm')} - {' '}
                    {entry.clock_out ? format(parseISO(entry.clock_out), 'HH:mm') : 'ongoing'}
                    {durationMinutes > 0 && entry.clock_out && (
                      <span className="ml-1">• {(durationMinutes / 60).toFixed(2)}h</span>
                    )}
                    {entry.notes && <span className="ml-1">• {entry.notes}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTimeReport;
