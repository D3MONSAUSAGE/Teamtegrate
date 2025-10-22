import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface InvoiceStatusBadgeProps {
  status: 'unpaid' | 'partial' | 'paid' | 'void' | 'pending' | 'overdue' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig = {
    unpaid: {
      label: 'Unpaid',
      icon: AlertCircle,
      className: 'bg-destructive/10 text-destructive border-destructive/20'
    },
    partial: {
      label: 'Partial',
      icon: Clock,
      className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20'
    },
    paid: {
      label: 'Paid',
      icon: CheckCircle,
      className: 'bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20'
    },
    void: {
      label: 'Void',
      icon: XCircle,
      className: 'bg-muted text-muted-foreground border-border'
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-500/20'
    },
    overdue: {
      label: 'Overdue',
      icon: AlertCircle,
      className: 'bg-destructive/10 text-destructive border-destructive/20'
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      className: 'bg-muted text-muted-foreground border-border'
    }
  };

  const config = statusConfig[status] || statusConfig.unpaid; // Fallback to unpaid if status not found
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge variant="outline" className={`${config.className} ${sizeClasses[size]} font-medium`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};

export default InvoiceStatusBadge;
