
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { startOfWeek, addDays, parseISO, differenceInMinutes } from 'date-fns';
import { formatTime12Hour, calculateBonusMinutes, formatHoursMinutes } from '@/utils/timeUtils';

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
      const entryDate = new Date(entry.clock_in).toISOString().split('T')[0];
      return entryDate === date.toISOString().split('T')[0];
    });
  };

  const calculateDayTotal = (dayEntries: typeof entries) => {
    const rawMinutes = dayEntries.reduce((total, entry) => {
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

    // Add bonus minutes
    const bonusMinutes = calculateBonusMinutes(rawMinutes);
    return { rawMinutes, bonusMinutes, total: rawMinutes + bonusMinutes };
  };

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
              <TableHead>Worked</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weekDays.map((day) => {
              const dayEntries = getDayEntries(day);
              const { rawMinutes, bonusMinutes, total } = calculateDayTotal(dayEntries);
              
              return (
                <TableRow key={day.toString()}>
                  <TableCell className="font-medium">
                    {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(day)}
                  </TableCell>
                  <TableCell>{formatHoursMinutes(rawMinutes)}</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400">
                    {bonusMinutes}m
                  </TableCell>
                  <TableCell className="font-bold">{formatHoursMinutes(total)}</TableCell>
                  <TableCell>
                    {dayEntries.map((entry, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {formatTime12Hour(entry.clock_in)} - {' '}
                        {entry.clock_out ? formatTime12Hour(entry.clock_out) : 'ongoing'}
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
