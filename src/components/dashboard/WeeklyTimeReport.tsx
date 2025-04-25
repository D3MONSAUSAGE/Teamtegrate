
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { startOfWeek, addDays, format } from 'date-fns';
import WeeklyTimeRow from './time/WeeklyTimeRow';
import { CalendarDays } from 'lucide-react';

interface WeeklyTimeReportProps {
  entries: Array<{
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  }>;
}

const WeeklyTimeReport: React.FC<WeeklyTimeReportProps> = ({ entries }) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;

  const getDayEntries = (date: Date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.clock_in).toISOString().split('T')[0];
      return entryDate === date.toISOString().split('T')[0];
    }).sort((a, b) => new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime());
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Weekly Time Report</CardTitle>
        </div>
        <p className="ml-auto text-sm text-muted-foreground">
          Week of {weekRange}
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[120px]">Day</TableHead>
                <TableHead className="w-[100px] hidden md:table-cell">Worked</TableHead>
                <TableHead className="w-[80px] hidden md:table-cell">Bonus</TableHead>
                <TableHead className="w-[100px] text-center">Breaks</TableHead>
                <TableHead className="w-[100px]">Total</TableHead>
                <TableHead className="w-[400px]">Time Log</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekDays.map((day, index) => (
                <WeeklyTimeRow
                  key={index}
                  day={day}
                  dayEntries={getDayEntries(day)}
                  isMobile={true}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyTimeReport;
