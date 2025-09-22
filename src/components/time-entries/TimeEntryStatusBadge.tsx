import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface TimeEntryStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

export const TimeEntryStatusBadge: React.FC<TimeEntryStatusBadgeProps> = ({ 
  status, 
  size = 'default',
  showIcon = true 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          variant: 'default' as const,
          className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
          icon: CheckCircle,
          label: 'Approved'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          className: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: XCircle,
          label: 'Rejected'
        };
      case 'pending':
      default:
        return {
          variant: 'outline' as const,
          className: 'bg-warning/10 text-warning border-warning/20',
          icon: Clock,
          label: 'Pending'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}`}
    >
      {showIcon && <Icon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />}
      {config.label}
    </Badge>
  );
};