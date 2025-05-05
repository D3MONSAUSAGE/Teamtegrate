
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
      "text-sm p-3 rounded-md border transition-colors",
      isOngoing 
        ? "border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 shadow-sm" 
        : "border-muted-foreground/20 hover:bg-muted/30"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {format(clockIn, 'h:mm a')}
            {clockOut && (
              <>
                <span className="mx-1.5 text-muted-foreground">→</span>
                {format(clockOut, 'h:mm a')}
              </>
            )}
            {isOngoing && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 animate-pulse font-medium inline-flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1"></span>
                ongoing
              </span>
            )}
          </span>
        </div>
        
        {durationMinutes && (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-medium">
            {formatDuration(durationMinutes)}
          </span>
        )}
      </div>
      
      {entry.notes && (
        <Tooltip>
          <TooltipTrigger className="flex items-center gap-1.5 mt-1.5 text-muted-foreground text-xs italic group">
            <Info className="h-3 w-3 group-hover:text-primary transition-colors" />
            <span className="truncate max-w-[250px] group-hover:text-foreground transition-colors">{entry.notes}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[300px] bg-white dark:bg-gray-800 shadow-lg">
            {entry.notes}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default TimeDetailsRow;
