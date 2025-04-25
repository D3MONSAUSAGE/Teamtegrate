
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { startOfWeek, addDays } from 'date-fns';
import WeeklyTimeRow from './time/WeeklyTimeRow';

interface WeeklyTimeReportProps {
  entries: Array<{
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  }>;
}

const WeeklyTimeReport: React.FC<WeeklyTimeReportProps> = ({ entries }) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDayEntries = (date: Date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.clock_in).toISOString().split('T')[0];
      return entryDate === date.toISOString().split('T')[0];
    });
  };

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
              <TableHead>Breaks</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weekDays.map((day, index) => (
              <WeeklyTimeRow
                key={index}
                day={day}
                dayEntries={getDayEntries(day)}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default WeeklyTimeReport;
