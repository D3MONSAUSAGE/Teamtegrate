import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CorrectionRequestStatusBadgeProps {
  status: 'pending' | 'manager_approved' | 'approved' | 'rejected';
}

export const CorrectionRequestStatusBadge: React.FC<CorrectionRequestStatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    pending: {
      label: 'Pending Manager Review',
      variant: 'secondary' as const,
    },
    manager_approved: {
      label: 'Manager Approved - Pending Admin',
      variant: 'default' as const,
    },
    approved: {
      label: 'Approved',
      variant: 'default' as const,
    },
    rejected: {
      label: 'Rejected',
      variant: 'destructive' as const,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
};