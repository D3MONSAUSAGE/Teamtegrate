import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTimeEntryCorrectionRequests } from '@/hooks/useTimeEntryCorrectionRequests';

export const CorrectionRequestsOverview: React.FC = () => {
  const { requests, currentUser } = useTimeEntryCorrectionRequests();

  if (!currentUser) return null;

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    managerApproved: requests.filter(r => r.status === 'manager_approved').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const myStats = {
    myTotal: requests.filter(r => r.employee_id === currentUser.id).length,
    myPending: requests.filter(r => r.employee_id === currentUser.id && r.status !== 'approved' && r.status !== 'rejected').length,
  };

  const isManager = ['manager', 'admin', 'superadmin'].includes(currentUser.role);
  const isAdmin = ['admin', 'superadmin'].includes(currentUser.role);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Personal Stats */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">My Requests</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{myStats.myTotal}</p>
              {myStats.myPending > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {myStats.myPending} pending
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Pending Review (for managers) */}
      {isManager && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Manager Approved (for admins) */}
      {isAdmin && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Awaiting Final Approval</p>
              <p className="text-2xl font-bold">{stats.managerApproved}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Approved Requests */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </div>
        </div>
      </Card>

      {/* Rejected Requests */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <XCircle className="h-8 w-8 text-red-500" />
          <div>
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold">{stats.rejected}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};