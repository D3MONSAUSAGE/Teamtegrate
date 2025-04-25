
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Coffee } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTime12Hour, formatHoursMinutes } from '@/utils/timeUtils';
import { parseISO, differenceInMinutes, isToday } from 'date-fns';
import { calculateBreakRequirements } from '@/utils/breakTracking';
import TimeDetailsRow from './TimeDetailsRow';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";

interface WeeklyTimeRowProps {
  day: Date;
  dayEntries: Array<{
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  }>;
}

const WeeklyTimeRow: React.FC<WeeklyTimeRowProps> = ({ day, dayEntries }) => {
  const isCurrentDay = isToday(day);
  
  const dailyMinutes = dayEntries.reduce((acc, entry) => {
    let duration = entry.duration_minutes || 0;
    if (!duration && entry.clock_out) {
      duration = differenceInMinutes(parseISO(entry.clock_out), parseISO(entry.clock_in));
    }
    return acc + duration;
  }, 0);

  const { mealBreaks, restBreaks, earnedBreakMinutes } = calculateBreakRequirements(dailyMinutes);
  const total = dailyMinutes + earnedBreakMinutes;

  return (
    <TableRow className={cn(
      isCurrentDay && "bg-primary/5",
      "hover:bg-muted/50 transition-colors"
    )}>
      <TableCell className="font-medium">
        {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(day)}
      </TableCell>
      <TableCell>{formatHoursMinutes(dailyMinutes)}</TableCell>
      <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">
        +{earnedBreakMinutes}m
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger className="mx-auto block">
            <div className="flex items-center gap-2 justify-center">
              <Coffee className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{mealBreaks + restBreaks}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <p>{mealBreaks} meal breaks (30 min)</p>
              <p>{restBreaks} rest breaks (10 min)</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="font-bold">{formatHoursMinutes(total)}</TableCell>
      <TableCell>
        {dayEntries.length > 0 ? (
          <ScrollArea className="h-[90px] w-full pr-4">
            <div className="space-y-1">
              {dayEntries.map((entry, index) => (
                <TimeDetailsRow key={index} entry={entry} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <span className="text-sm text-muted-foreground">No entries</span>
        )}
      </TableCell>
    </TableRow>
  );
};

export default WeeklyTimeRow;
