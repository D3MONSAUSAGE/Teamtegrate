import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTimeOffRequests } from '@/hooks/useTimeOffRequests';
import { useTimeOffBalances } from '@/hooks/useTimeOffBalances';
import { useAuth } from '@/contexts/AuthContext';
import { TimeOffRequest } from '@/types/employee';
import { format } from 'date-fns';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

interface TimeOffRequestDetailsProps {
  request: TimeOffRequest & { user?: { id: string; name: string; email: string } };
  onClose: () => void;
}

const LEAVE_TYPE_COLORS: Record<string, string> = {
  vacation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  sick: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  unpaid: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  denied: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export function TimeOffRequestDetails({ request, onClose }: TimeOffRequestDetailsProps) {
  const { user } = useAuth();
  const { approveRequest, denyRequest } = useTimeOffRequests();
  const { getAvailableHours } = useTimeOffBalances(request.user_id);
  
  const canManage = user?.role && ['manager', 'admin', 'superadmin', 'team_leader'].includes(user.role);
  const isPending = request.status === 'pending';
  const availableHours = getAvailableHours(request.leave_type);

  const handleApprove = () => {
    if (user?.id) {
      approveRequest({ requestId: request.id, approverId: user.id });
      onClose();
    }
  };

  const handleDeny = () => {
    if (user?.id) {
      denyRequest({ requestId: request.id, approverId: user.id });
      onClose();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Time Off Request</h2>
        <p className="text-muted-foreground">
          {request.user ? `Request from ${request.user.name || request.user.email}` : 'Review and manage time off request'}
        </p>
      </div>

      {/* Request Details */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Leave Type</div>
              <div className="font-semibold capitalize">{request.leave_type}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={STATUS_COLORS[request.status]}>
              {request.status}
            </Badge>
            <Badge className={LEAVE_TYPE_COLORS[request.leave_type]}>
              {request.leave_type}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Start Date</div>
            <div className="font-semibold">{format(new Date(request.start_date), 'MMM d, yyyy')}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">End Date</div>
            <div className="font-semibold">{format(new Date(request.end_date), 'MMM d, yyyy')}</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Hours Requested</div>
          <div className="font-semibold">{request.hours_requested} hours ({Math.floor(request.hours_requested / 8)} days)</div>
          {request.leave_type !== 'unpaid' && (
            <div className="text-xs text-muted-foreground mt-1">
              Available balance: {availableHours} hours
            </div>
          )}
        </div>

        {request.notes && (
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Notes</div>
            <div className="text-sm">{request.notes}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      {canManage && isPending && (
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleDeny}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Deny Request
          </Button>
          <Button
            onClick={handleApprove}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Approve Request
          </Button>
        </div>
      )}
    </div>
  );
}
