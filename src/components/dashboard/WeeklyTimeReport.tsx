
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { startOfWeek, addDays, format, parseISO, differenceInMinutes } from 'date-fns';
import { Coffee, Clock } from 'lucide-react';

interface WeeklyTimeReportProps {
  entries: Array<{
    id: string;
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  }>;
}

const WeeklyTimeReport: React.FC<WeeklyTimeReportProps> = ({ entries }) => {
  const getDayEntries = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return entries.filter(entry => {
      const entryDate = format(parseISO(entry.clock_in), 'yyyy-MM-dd');
      return entryDate === dateString;
    }).sort((a, b) => new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime());
  };

  const calculateDayTotal = (dayEntries: typeof entries) => {
    return dayEntries.reduce((total, entry) => {
      if (entry.duration_minutes) {
        // If we have a pre-calculated duration, use it
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
    }, 0) / 60; // Convert minutes to hours
  };

  // Get the start of the current week (Monday)
  const weekStart = entries.length > 0
    ? startOfWeek(parseISO(entries[0].clock_in), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 });
    
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Weekly Time Report</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weekDays.map((day) => {
              const dayEntries = getDayEntries(day);
              const totalHours = calculateDayTotal(dayEntries);
              
              return (
                <TableRow key={day.toString()}>
                  <TableCell className="font-medium">
                    {format(day, 'EEEE (MM/dd)')}
                  </TableCell>
                  <TableCell>{totalHours.toFixed(2)}</TableCell>
                  <TableCell>
                    {dayEntries.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No entries</span>
                    ) : (
                      <div className="space-y-1">
                        {dayEntries.map((entry) => {
                          const isBreak = entry.notes && 
                            (entry.notes.toLowerCase().includes('break') || 
                             entry.notes.toLowerCase().includes('lunch'));
                          
                          const entryIcon = isBreak ? 
                            <Coffee className="h-3 w-3 inline mr-1" /> : 
                            <Clock className="h-3 w-3 inline mr-1" />;
                          
                          // Calculate duration if available
                          let durationText = '';
                          if (entry.duration_minutes && entry.clock_out) {
                            const hours = (entry.duration_minutes / 60).toFixed(2);
                            durationText = ` (${hours}h)`;
                          } else if (entry.clock_out) {
                            const minutesDiff = differenceInMinutes(
                              parseISO(entry.clock_out),
                              parseISO(entry.clock_in)
                            );
                            const hours = (minutesDiff / 60).toFixed(2);
                            durationText = ` (${hours}h)`;
                          }
                          
                          return (
                            <div 
                              key={entry.id} 
                              className={`text-xs flex items-center ${isBreak ? 'italic text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
                            >
                              {entryIcon}
                              {format(parseISO(entry.clock_in), 'HH:mm')} - {' '}
                              {entry.clock_out ? format(parseISO(entry.clock_out), 'HH:mm') : 'ongoing'}
                              {durationText}
                              {entry.notes && <span className="ml-1"> • {entry.notes}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default WeeklyTimeReport;
