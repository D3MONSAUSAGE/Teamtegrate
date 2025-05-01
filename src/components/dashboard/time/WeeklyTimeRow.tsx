
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Coffee } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatHoursMinutes } from '@/utils/timeUtils';
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
  isMobile?: boolean;
}

const WeeklyTimeRow: React.FC<WeeklyTimeRowProps> = ({ day, dayEntries, isMobile }) => {
  const isCurrentDay = isToday(day);
  
  // Calculate total minutes for all entries for this day
  const dailyMinutes = dayEntries.reduce((acc, entry) => {
    // If duration_minutes is available, use it
    if (entry.duration_minutes !== null && entry.duration_minutes !== undefined) {
      return acc + entry.duration_minutes;
    } 
    // If clock_out exists, calculate duration
    else if (entry.clock_out) {
      const duration = differenceInMinutes(parseISO(entry.clock_out), parseISO(entry.clock_in));
      return acc + duration;
    }
    // For ongoing entries, calculate duration up to now
    else if (entry.clock_in) {
      const duration = differenceInMinutes(new Date(), parseISO(entry.clock_in));
      return acc + duration;
    }
    return acc;
  }, 0);

  const { mealBreaks, restBreaks, earnedBreakMinutes } = calculateBreakRequirements(dailyMinutes);
  const total = dailyMinutes + earnedBreakMinutes;

  return (
    <TableRow className={cn(
      isCurrentDay && "bg-primary/5",
      "hover:bg-muted/50 transition-colors"
    )}>
      <TableCell className="font-medium w-[120px]">
        {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(day)}
      </TableCell>
      <TableCell className="w-[100px] hidden md:table-cell">{formatHoursMinutes(dailyMinutes)}</TableCell>
      <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium w-[80px] hidden md:table-cell">
        +{earnedBreakMinutes}m
      </TableCell>
      <TableCell className="w-[100px]">
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
      <TableCell className="font-bold w-[100px]">{formatHoursMinutes(total)}</TableCell>
      <TableCell className="w-[400px]">
        {dayEntries.length > 0 ? (
          <ScrollArea className="h-auto max-h-[200px] w-full pr-4">
            <div className="space-y-2">
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
