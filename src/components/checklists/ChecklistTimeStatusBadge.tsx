import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { useChecklistTimeWindow } from '@/hooks/useChecklistTimeWindow';
import { getTimeStatusStyling } from '@/utils/checklistTimeUtils';
import { Checklist, ChecklistExecution } from '@/types/checklist';
import { cn } from '@/lib/utils';

interface ChecklistTimeStatusBadgeProps {
  checklist: Checklist | ChecklistExecution['checklist'] | null;
  executionDate?: string;
  size?: 'sm' | 'md' | 'lg';
  showCountdown?: boolean;
  className?: string;
}

export const ChecklistTimeStatusBadge: React.FC<ChecklistTimeStatusBadgeProps> = ({
  checklist,
  executionDate,
  size = 'md',
  showCountdown = true,
  className
}) => {
  const { status, message, countdown, isInWindow } = useChecklistTimeWindow(checklist, executionDate);
  const styling = getTimeStatusStyling(status);

  const getIcon = () => {
    switch (status) {
      case 'available':
        return <CheckCircle className={cn('h-3 w-3', styling.icon)} />;
      case 'upcoming':
        return <Clock className={cn('h-3 w-3', styling.icon)} />;
      case 'expired':
        return <AlertCircle className={cn('h-3 w-3', styling.icon)} />;
      default:
        return <Calendar className={cn('h-3 w-3', styling.icon)} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return 'Available Now';
      case 'upcoming':
        return 'Coming Soon';
      case 'expired':
        return 'Time Expired';
      default:
        return 'No Schedule';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Badge 
        className={cn(
          styling.badge,
          sizeClasses[size],
          'flex items-center gap-1.5 font-medium transition-all duration-200',
          isInWindow && 'animate-pulse'
        )}
      >
        {getIcon()}
        <span>{getStatusText()}</span>
      </Badge>
      
      {showCountdown && countdown && status !== 'no-window' && (
        <div className="text-xs text-muted-foreground font-mono">
          {status === 'available' ? `Expires in ${countdown}` : countdown}
        </div>
      )}
      
      {status === 'no-window' && (
        <div className="text-xs text-muted-foreground">
          Available anytime
        </div>
      )}
    </div>
  );
};

export default ChecklistTimeStatusBadge;