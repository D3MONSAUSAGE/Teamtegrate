
import React from 'react';
import { formatTime12Hour, formatHoursMinutes } from '@/utils/timeUtils';

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
  
  return (
    <div className="text-xs text-muted-foreground">
      {formatTime12Hour(entry.clock_in)} - {' '}
      {entry.clock_out ? formatTime12Hour(entry.clock_out) : 'ongoing'}
      {durationMinutes > 0 && entry.clock_out && (
        <span className="ml-1">• {formatHoursMinutes(durationMinutes)}</span>
      )}
      {entry.notes && <span className="ml-1">• {entry.notes}</span>}
    </div>
  );
};

export default TimeDetailsRow;
