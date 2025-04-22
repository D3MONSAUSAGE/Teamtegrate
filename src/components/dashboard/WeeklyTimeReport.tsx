
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { startOfWeek, addDays, format, parseISO, differenceInMinutes } from 'date-fns';

interface WeeklyTimeReportProps {
  entries: Array<{
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
    });
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

  // Get the week start from the first entry or current week if no entries
  const firstEntryDate = entries.length > 0 ? parseISO(entries[0].clock_in) : new Date();
  const weekStart = startOfWeek(firstEntryDate, { weekStartsOn: 1 });
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
                      <span className="text-xs text-muted-foreground">No entries</span>
                    ) : (
                      dayEntries.map((entry, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          {format(parseISO(entry.clock_in), 'HH:mm')} - {' '}
                          {entry.clock_out ? format(parseISO(entry.clock_out), 'HH:mm') : 'ongoing'}
                          {entry.notes && ` - ${entry.notes}`}
                        </div>
                      ))
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
