
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { startOfWeek, addDays, format } from 'date-fns';

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
    return entries.filter(entry => {
      const entryDate = new Date(entry.clock_in);
      return format(entryDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const calculateDayTotal = (dayEntries: typeof entries) => {
    return dayEntries.reduce((total, entry) => {
      return total + (entry.duration_minutes || 0);
    }, 0) / 60; // Convert minutes to hours
  };

  // Get the start of the current week (Monday)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
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
                    {dayEntries.map((entry, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {format(new Date(entry.clock_in), 'HH:mm')} - {' '}
                        {entry.clock_out ? format(new Date(entry.clock_out), 'HH:mm') : 'ongoing'}
                        {entry.notes && ` - ${entry.notes}`}
                      </div>
                    ))}
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
