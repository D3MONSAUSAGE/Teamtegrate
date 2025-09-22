import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Calendar,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import { EmployeeTimeStatusBadge } from './EmployeeTimeStatusBadge';
import { formatHoursMinutes } from '@/utils/timeUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string;
  duration_minutes: number;
  notes?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
}

interface EmployeeTimeStatusCardProps {
  entries: TimeEntry[];
  onRequestCorrection?: (entryId: string) => void;
  isLoading?: boolean;
}

export const EmployeeTimeStatusCard: React.FC<EmployeeTimeStatusCardProps> = ({
  entries,
  onRequestCorrection,
  isLoading = false
}) => {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  const pendingCount = entries.filter(e => e.approval_status === 'pending').length;
  const approvedCount = entries.filter(e => e.approval_status === 'approved').length;
  const rejectedCount = entries.filter(e => e.approval_status === 'rejected').length;

  const getStatusSummary = () => {
    if (rejectedCount > 0) {
      return {
        type: 'warning' as const,
        message: `${rejectedCount} time ${rejectedCount === 1 ? 'entry' : 'entries'} rejected - review required`,
        icon: AlertTriangle
      };
    }
    if (pendingCount > 0) {
      return {
        type: 'info' as const,
        message: `${pendingCount} time ${pendingCount === 1 ? 'entry' : 'entries'} pending approval`,
        icon: Clock
      };
    }
    return {
      type: 'success' as const,
      message: 'All time entries approved',
      icon: CheckCircle
    };
  };

  const summary = getStatusSummary();
  const StatusIcon = summary.icon;

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No Time Entries</p>
          <p className="text-muted-foreground">
            Your time entries will appear here once you clock in and out
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Time Entry Status</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={() => window.location.reload()}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Summary Alert */}
          <Alert className={cn(
            summary.type === 'warning' && "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
            summary.type === 'info' && "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
            summary.type === 'success' && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
          )}>
            <StatusIcon className="h-4 w-4" />
            <AlertDescription>{summary.message}</AlertDescription>
          </Alert>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.slice(0, 5).map((entry, index) => (
            <div key={entry.id}>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">
                        {format(new Date(entry.clock_in), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {format(new Date(entry.clock_in), 'h:mm a')} - {format(new Date(entry.clock_out), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  <Separator orientation="vertical" className="h-8" />
                  
                  <div className="text-sm">
                    <div className="font-medium">{formatHoursMinutes(entry.duration_minutes)}</div>
                    <div className="text-muted-foreground text-xs">Duration</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <EmployeeTimeStatusBadge 
                    status={{
                      approval_status: entry.approval_status,
                      approved_at: entry.approved_at,
                      approved_by: entry.approved_by,
                      approval_notes: entry.approval_notes
                    }}
                    size="sm"
                  />
                  
                  {entry.approval_status === 'rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Rejection Details */}
              {selectedEntry === entry.id && entry.approval_status === 'rejected' && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Rejection Reason
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {entry.approval_notes || 'No reason provided'}
                      </p>
                      {onRequestCorrection && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900"
                          onClick={() => onRequestCorrection(entry.id)}
                        >
                          Request Correction
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {index < entries.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}

          {entries.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm">
                View All {entries.length} Entries
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};