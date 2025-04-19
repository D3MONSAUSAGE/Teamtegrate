
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
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
  // Calculate total duration from all entries with duration_minutes value
  const completedEntriesTotalMinutes = entries.reduce((total, entry) => {
    return total + (entry.duration_minutes || 0);
  }, 0);

  // Calculate total hours from minutes
  const totalHours = completedEntriesTotalMinutes / 60;
  
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
            {entries.map((entry, index) => (
              <div key={index} className="text-xs text-muted-foreground">
                {format(new Date(entry.clock_in), 'HH:mm')} - {' '}
                {entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : 'ongoing'}
                {entry.duration_minutes && entry.clock_out && (
                  <span className="ml-1">• {(entry.duration_minutes / 60).toFixed(2)}h</span>
                )}
                {entry.notes && <span className="ml-1">• {entry.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTimeReport;
