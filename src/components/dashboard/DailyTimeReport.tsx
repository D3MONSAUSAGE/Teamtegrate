
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { FileText, Coffee, Clock } from 'lucide-react';

interface DailyTimeReportProps {
  entries: Array<{
    id: string;
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
  
  // Sort entries by clock_in time to ensure chronological display
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime()
  );
  
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
            {sortedEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No time entries for today</p>
            ) : (
              sortedEntries.map((entry) => {
                // Calculate duration for this entry
                let durationMinutes = entry.duration_minutes || 0;
                if (!durationMinutes && entry.clock_out) {
                  durationMinutes = differenceInMinutes(
                    parseISO(entry.clock_out),
                    parseISO(entry.clock_in)
                  );
                }
                
                // Show special formatting for entries with break notes
                const isBreak = entry.notes && 
                  (entry.notes.toLowerCase().includes('break') || 
                   entry.notes.toLowerCase().includes('lunch'));
                
                const entryIcon = isBreak ? <Coffee className="h-3 w-3 inline mr-1" /> : <Clock className="h-3 w-3 inline mr-1" />;
                
                return (
                  <div 
                    key={entry.id} 
                    className={`text-xs ${isBreak ? 'italic' : ''} ${isBreak ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'} flex items-center`}
                  >
                    {entryIcon}
                    {format(parseISO(entry.clock_in), 'HH:mm')} - {' '}
                    {entry.clock_out ? format(parseISO(entry.clock_out), 'HH:mm') : 'ongoing'}
                    {durationMinutes > 0 && entry.clock_out && (
                      <span className="ml-1">• {(durationMinutes / 60).toFixed(2)}h</span>
                    )}
                    {entry.notes && (
                      <span className="ml-1 font-medium">
                        • {entry.notes}
                      </span>
                    )}
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
