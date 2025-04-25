
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Coffee } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTime12Hour, formatHoursMinutes } from '@/utils/timeUtils';
import { parseISO, differenceInMinutes } from 'date-fns';
import { calculateBreakRequirements } from '@/utils/breakTracking';

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
  const { rawMinutes, bonusMinutes, total } = dayEntries.reduce((acc, entry) => {
    let duration = entry.duration_minutes || 0;
    if (!duration && entry.clock_out) {
      duration = differenceInMinutes(parseISO(entry.clock_out), parseISO(entry.clock_in));
    }
    acc.rawMinutes += duration;
    acc.bonusMinutes = acc.rawMinutes >= 480 ? 20 : 10;
    acc.total = acc.rawMinutes + acc.bonusMinutes;
    return acc;
  }, { rawMinutes: 0, bonusMinutes: 0, total: 0 });

  const { mealBreaks, restBreaks } = calculateBreakRequirements(rawMinutes);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(day)}
      </TableCell>
      <TableCell>{formatHoursMinutes(rawMinutes)}</TableCell>
      <TableCell className="text-emerald-600 dark:text-emerald-400">
        {bonusMinutes}m
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              <Coffee className="h-4 w-4" />
              <span>{mealBreaks + restBreaks}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{mealBreaks} meal breaks (30 min)</p>
            <p>{restBreaks} rest breaks (10 min)</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="font-bold">{formatHoursMinutes(total)}</TableCell>
      <TableCell>
        {dayEntries.map((entry, index) => (
          <TimeDetailsRow key={index} entry={entry} />
        ))}
      </TableCell>
    </TableRow>
  );
};

export default WeeklyTimeRow;
