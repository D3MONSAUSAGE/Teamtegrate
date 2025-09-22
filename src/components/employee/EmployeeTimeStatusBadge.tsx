import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeEntryStatus {
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  approval_notes?: string;
}

interface EmployeeTimeStatusBadgeProps {
  status: TimeEntryStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const EmployeeTimeStatusBadge: React.FC<EmployeeTimeStatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
  size = 'md'
}) => {
  const getStatusConfig = () => {
    switch (status.approval_status) {
      case 'approved':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
          icon: CheckCircle,
          label: 'Approved'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800',
          icon: XCircle,
          label: 'Rejected'
        };
      default:
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
          icon: Clock,
          label: 'Pending Review'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={config.variant}
        className={cn(
          config.className,
          sizeClasses[size],
          'flex items-center gap-1.5 font-medium',
          className
        )}
      >
        {showIcon && <IconComponent className={iconSizes[size]} />}
        {config.label}
      </Badge>
      
      {status.approval_status === 'rejected' && status.approval_notes && (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-xs font-medium">See notes</span>
        </div>
      )}
    </div>
  );
};