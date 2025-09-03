
import React from 'react';
import { formatTime12Hour } from '@/utils/timeUtils';
import { Coffee, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import TimeEntryActionButtons from './TimeEntryActionButtons';

interface TimeDetailsRowProps {
  entry: {
    id?: string;
    user_id?: string;
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  };
}

const TimeDetailsRow: React.FC<TimeDetailsRowProps> = ({ entry }) => {
  const isBreak = entry.notes?.toLowerCase().includes('break') || false;
  const isLunch = entry.notes?.toLowerCase().includes('lunch') || false;
  
  const getEntryIcon = () => {
    if (isBreak || isLunch) {
      return <Coffee className="h-4 w-4 text-muted-foreground" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };
  
  return (
    <div className={cn(
      "rounded-md py-2 px-3 flex items-center gap-3 text-sm border",
      isBreak || isLunch ? "bg-muted/30 border-muted" : "border-border",
      "hover:bg-accent/50 transition-colors"
    )}>
      {getEntryIcon()}
      <div className="flex items-center gap-2 font-medium">
        <span>{formatTime12Hour(entry.clock_in)}</span>
        <span className="text-muted-foreground">→</span>
        <span>{entry.clock_out ? formatTime12Hour(entry.clock_out) : 'ongoing'}</span>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        {(isBreak || isLunch) && (
          <span className="text-sm text-muted-foreground capitalize">
            {entry.notes?.split(' ')[0]}
          </span>
        )}
        <TimeEntryActionButtons entry={entry} />
      </div>
    </div>
  );
};

export default TimeDetailsRow;
