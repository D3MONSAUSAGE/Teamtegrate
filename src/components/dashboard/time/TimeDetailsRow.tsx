
import React from 'react';
import { formatTime12Hour, formatHoursMinutes } from '@/utils/timeUtils';
import { TableCell } from "@/components/ui/table";
import { ClockIcon } from 'lucide-react';

interface TimeDetailsRowProps {
  entry: {
    clock_in: string;
    clock_out?: string | null;
    duration_minutes?: number | null;
    notes?: string | null;
  };
}

const TimeDetailsRow: React.FC<TimeDetailsRowProps> = ({ entry }) => {
  const durationMinutes = entry.duration_minutes || 0;
  const isBreak = entry.notes?.toLowerCase().includes('break') || false;
  const isLunch = entry.notes?.toLowerCase().includes('lunch') || false;
  
  const getEntryTypeIcon = () => {
    if (isBreak || isLunch) {
      return <ClockIcon size={14} className="text-muted-foreground mr-1" />;
    }
    return null;
  };
  
  return (
    <div className={`rounded-md py-1 px-1 flex items-center gap-2 text-xs ${
      isBreak 
        ? 'text-amber-700 dark:text-amber-400' 
        : isLunch 
          ? 'text-blue-700 dark:text-blue-400' 
          : 'text-muted-foreground'
    }`}>
      {getEntryTypeIcon()}
      <div className="flex-1 flex items-center">
        <div className="w-[75px]">
          {formatTime12Hour(entry.clock_in)}
        </div>
        <div className="mx-1">-</div>
        <div>
          {entry.clock_out ? formatTime12Hour(entry.clock_out) : 'ongoing'}
        </div>
      </div>
      
      {durationMinutes > 0 && entry.clock_out && (
        <div className="font-medium ml-auto">
          {formatHoursMinutes(durationMinutes)}
        </div>
      )}
      
      {entry.notes && !isBreak && !isLunch && (
        <div className="ml-1 italic truncate max-w-[100px]">{entry.notes}</div>
      )}
    </div>
  );
};

export default TimeDetailsRow;
