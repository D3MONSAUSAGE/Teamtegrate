
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { startOfWeek, addDays, format, isSameDay, isToday } from 'date-fns';
import WeeklyTimeRow from './time/WeeklyTimeRow';
import { CalendarDays, Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

interface WeeklyTimeReportProps {
  entries: Array<{
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  }>;
  weekDate?: Date;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onWeekChange?: (direction: 'prev' | 'next' | 'current') => void;
}

const WeeklyTimeReport: React.FC<WeeklyTimeReportProps> = ({ 
  entries, 
  weekDate = new Date(),
  selectedDate,
  onDateSelect
}) => {
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;

  // Calculate total hours for the week
  const totalMinutes = entries.reduce((acc, entry) => {
    if (entry.duration_minutes) {
      return acc + entry.duration_minutes;
    }
    if (entry.clock_in && entry.clock_out) {
      const start = new Date(entry.clock_in);
      const end = new Date(entry.clock_out);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60);
    }
    return acc;
  }, 0);
  
  const totalHours = (totalMinutes / 60).toFixed(1);

  const getDayEntries = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Filter entries for the specified day
    return entries.filter(entry => {
      const entryDate = format(new Date(entry.clock_in), 'yyyy-MM-dd');
      return entryDate === formattedDate;
    }).sort((a, b) => new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 p-1.5 rounded-full">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-medium">Weekly Summary</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 bg-card shadow-sm">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">{totalHours} hrs</span>
          </Badge>
          <p className="text-sm text-muted-foreground">
            {weekRange}
          </p>
        </div>
      </div>

      <div className="border border-border rounded-lg shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[140px] font-semibold">Day</TableHead>
                <TableHead className="w-[100px] hidden md:table-cell font-semibold">Worked</TableHead>
                <TableHead className="w-[80px] hidden md:table-cell font-semibold">Bonus</TableHead>
                <TableHead className="w-[100px] text-center font-semibold">Breaks</TableHead>
                <TableHead className="w-[100px] font-semibold">Total</TableHead>
                <TableHead className="w-[400px] font-semibold">Time Log</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekDays.map((day, index) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentDay = isToday(day);
                return (
                  <WeeklyTimeRow
                    key={index}
                    day={day}
                    dayEntries={getDayEntries(day)}
                    isSelected={isSelected}
                    isCurrentDay={isCurrentDay}
                    onClick={onDateSelect ? () => onDateSelect(day) : undefined}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTimeReport;
