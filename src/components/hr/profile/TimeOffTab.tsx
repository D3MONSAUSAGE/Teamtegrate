import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTimeOffBalances } from '@/hooks/useTimeOffBalances';
import { useTimeOffRequests } from '@/hooks/useTimeOffRequests';
import { Clock, Calendar, Plus, Shield, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import TimeOffRequestDialog from '../TimeOffRequestDialog';
import TimeOffAccrualHistory from '../TimeOffAccrualHistory';

interface TimeOffTabProps {
  userId: string;
}

const TimeOffTab: React.FC<TimeOffTabProps> = ({ userId }) => {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const { balances, isLoading: balancesLoading } = useTimeOffBalances(userId);
  const { requests, isLoading: requestsLoading } = useTimeOffRequests(userId);

  const sickBalance = useMemo(() => 
    balances.find(b => b.leave_type === 'sick'), 
    [balances]
  );

  const isInWaitingPeriod = useMemo(() => {
    if (!sickBalance?.can_use_after_date) return false;
    
    const canUseDate = new Date(sickBalance.can_use_after_date);
    const today = new Date();
    
    return today < canUseDate;
  }, [sickBalance]);

  const waitingPeriodDaysRemaining = useMemo(() => {
    if (!isInWaitingPeriod || !sickBalance?.can_use_after_date) return 0;
    
    const canUseDate = new Date(sickBalance.can_use_after_date);
    const today = new Date();
    return Math.ceil((canUseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [isInWaitingPeriod, sickBalance]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'denied':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (balancesLoading || requestsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Waiting Period Alert */}
      {isInWaitingPeriod && sickBalance && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">90-Day Waiting Period Active</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            This employee can use sick leave starting {format(new Date(sickBalance.can_use_after_date!), 'MMMM d, yyyy')}
            {' '}({waitingPeriodDaysRemaining} days remaining)
            <br />
            <span className="text-xs">
              California law allows a 90-day waiting period from hire date before sick leave can be used.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Time Off Balances</h3>
        <Button onClick={() => setShowRequestDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Request Time Off
        </Button>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {balances.map((balance) => {
          const available = balance.total_hours - balance.used_hours;
          const percentage = (available / balance.total_hours) * 100;

          return (
            <div key={balance.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold capitalize">{balance.leave_type}</h4>
                  {balance.is_california_compliant && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800">
                      CA Compliant
                    </Badge>
                  )}
                </div>
                <Badge variant="outline">
                  {available}h / {balance.total_hours}h
                </Badge>
              </div>

              <Progress value={percentage} className="h-2" />

              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Used: {balance.used_hours} hours ({Math.floor(balance.used_hours / 8)} days)
                </p>
                <p>
                  Available: {available} hours ({Math.floor(available / 8)} days)
                </p>
                {balance.max_balance_cap && (
                  <p className="text-xs">
                    Cap: {balance.max_balance_cap} hours
                  </p>
                )}
                {balance.carryover_from_previous_year && balance.carryover_from_previous_year > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Includes {balance.carryover_from_previous_year}h carryover
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Time Off Requests</h3>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            No time off requests yet
          </div>
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 10).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium capitalize">{request.leave_type}</p>
                    <Badge variant={getStatusColor(request.status)}>{request.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      {format(new Date(request.start_date), 'MMM d, yyyy')} -{' '}
                      {format(new Date(request.end_date), 'MMM d, yyyy')}
                    </p>
                    <p>{request.hours_requested} hours requested</p>
                    {request.notes && <p className="mt-1 italic">"{request.notes}"</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accrual History for sick leave */}
      {sickBalance?.is_california_compliant && (
        <TimeOffAccrualHistory userId={userId} leaveType="sick" />
      )}

      <TimeOffRequestDialog
        userId={userId}
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />
    </div>
  );
};

export default TimeOffTab;
