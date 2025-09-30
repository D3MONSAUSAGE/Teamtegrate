import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserTimezone } from '@/hooks/useUserTimezone';

interface TimezoneIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const TimezoneIndicator: React.FC<TimezoneIndicatorProps> = ({ 
  className = "",
  showLabel = true 
}) => {
  const { userTimezone, isLoading } = useUserTimezone();

  if (isLoading) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          Your timezone:
        </span>
      )}
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {userTimezone}
      </Badge>
    </div>
  );
};
