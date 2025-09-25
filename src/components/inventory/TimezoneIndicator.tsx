import React from 'react';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { Clock } from 'lucide-react';

interface TimezoneIndicatorProps {
  className?: string;
}

export const TimezoneIndicator: React.FC<TimezoneIndicatorProps> = ({ className = "" }) => {
  const { userTimezone } = useUserTimezone();
  
  if (!userTimezone || userTimezone === 'UTC') {
    return null;
  }

  // Get a friendly timezone name
  const getTimezoneName = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', { 
        timeZone: tz, 
        timeZoneName: 'short' 
      }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value || tz;
    } catch {
      return tz;
    }
  };

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <Clock className="w-3 h-3" />
      <span>All times in {getTimezoneName(userTimezone)}</span>
    </div>
  );
};