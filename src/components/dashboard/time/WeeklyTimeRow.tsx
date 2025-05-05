
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Coffee, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatHoursMinutes } from '@/utils/timeUtils';
import { parseISO, differenceInMinutes, isToday } from 'date-fns';
import { calculateBreakRequirements } from '@/utils/breakTracking';
import TimeDetailsRow from './TimeDetailsRow';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';

interface WeeklyTimeRowProps {
  day: Date;
  dayEntries: Array<{
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  }>;
  isSelected?: boolean;
  isCurrentDay?: boolean;
  onClick?: () => void;
}

const WeeklyTimeRow: React.FC<WeeklyTimeRowProps> = ({ 
  day, 
  dayEntries, 
  isSelected, 
  isCurrentDay, 
  onClick 
}) => {
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
  const hasEntries = dayEntries.length > 0;

  return (
    <TableRow 
      className={cn(
        "transition-colors border-l-2 cursor-pointer",
        isCurrentDay && "bg-primary/5 border-l-primary",
        isSelected && "bg-secondary/10 border-l-secondary",
        !isCurrentDay && !isSelected && "border-l-transparent",
        hasEntries ? "hover:bg-muted/40" : "hover:bg-muted/20"
      )}
      onClick={onClick}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "",
            isCurrentDay && "text-primary font-semibold"
          )}>
            {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(day)}
          </span>
          {isCurrentDay && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 border-primary text-primary">Today</Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <span className={cn(
          "font-medium",
          dailyMinutes > 0 && "text-foreground"
        )}>
          {formatHoursMinutes(dailyMinutes)}
        </span>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        {earnedBreakMinutes > 0 ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            +{earnedBreakMinutes}m
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell>
        {mealBreaks + restBreaks > 0 ? (
          <Tooltip>
            <TooltipTrigger className="mx-auto block">
              <div className="flex items-center gap-1 justify-center">
                <Coffee className="h-4 w-4 text-amber-500" />
                <span className="text-sm">{mealBreaks + restBreaks}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white dark:bg-gray-800 border shadow-lg">
              <div className="text-sm space-y-1">
                <p>{mealBreaks} meal break{mealBreaks !== 1 ? 's' : ''} (30 min)</p>
                <p>{restBreaks} rest break{restBreaks !== 1 ? 's' : ''} (10 min)</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground text-center block">-</span>
        )}
      </TableCell>

      <TableCell className="font-bold">
        {total > 0 ? (
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {formatHoursMinutes(total)}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell>
        {dayEntries.length > 0 ? (
          <ScrollArea className="h-auto max-h-[250px] w-full pr-4">
            <div className="space-y-2">
              {dayEntries.map((entry, index) => (
                <TimeDetailsRow key={index} entry={entry} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <span className="text-sm text-muted-foreground italic">No entries</span>
        )}
      </TableCell>
    </TableRow>
  );
};

export default WeeklyTimeRow;
