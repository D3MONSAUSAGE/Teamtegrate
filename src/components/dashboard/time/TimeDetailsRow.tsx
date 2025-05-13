
import React from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Clock, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/timeUtils';

interface TimeDetailsRowProps {
  entry: {
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  };
}

const TimeDetailsRow: React.FC<TimeDetailsRowProps> = ({ entry }) => {
  const clockIn = parseISO(entry.clock_in);
  const clockOut = entry.clock_out ? parseISO(entry.clock_out) : null;
  
  // Calculate duration in minutes
  let durationMinutes = entry.duration_minutes;
  if (!durationMinutes && clockOut) {
    durationMinutes = differenceInMinutes(clockOut, clockIn);
  }
  
  const isOngoing = !entry.clock_out;
  
  return (
    <div className={cn(
      "text-sm p-2 rounded-md border transition-colors",
      isOngoing 
        ? "border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800" 
        : "border-muted-foreground/20 hover:bg-muted/30"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">
            {format(clockIn, 'h:mm a')}
            {clockOut && (
              <>
                <span className="mx-1">-</span>
                {format(clockOut, 'h:mm a')}
              </>
            )}
            {isOngoing && (
              <span className="ml-1 text-blue-600 dark:text-blue-400 animate-pulse font-medium">
                (ongoing)
              </span>
            )}
          </span>
        </div>
        
        {durationMinutes && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
            {formatDuration(durationMinutes)}
          </span>
        )}
      </div>
      
      {entry.notes && (
        <Tooltip>
          <TooltipTrigger className="flex items-center gap-1 mt-1 text-muted-foreground text-xs italic">
            <Info className="h-3 w-3" />
            <span className="truncate max-w-[250px]">{entry.notes}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[300px]">
            {entry.notes}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default TimeDetailsRow;
