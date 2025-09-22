import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { formatHoursMinutes } from '@/utils/timeUtils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { approvalNotifications } from '@/lib/notifications/approvalNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  user_id: string;
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  clock_in: string;
  clock_out: string;
  duration_minutes: number;
  notes?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  team_id?: string;
}

interface TimeEntryApprovalCardProps {
  entry: TimeEntry;
  onApprovalChange?: () => void;
}

export const TimeEntryApprovalCard: React.FC<TimeEntryApprovalCardProps> = ({
  entry,
  onApprovalChange
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !approvalNotes.trim()) {
      setShowNotesInput(true);
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!user) {
      toast.error('Authentication required');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('approve_time_entry', {
        entry_id: entry.id,
        approval_action: action,
        approval_notes: action === 'reject' ? approvalNotes : null
      } as any);

      if (error) throw error;

      // Send notification based on action
      const notificationData = {
        orgId: user.organizationId,
        teamId: entry.team_id || null,
        entry: {
          id: entry.id,
          user_id: entry.user_id,
          user_name: entry.user?.name || 'Unknown',
          duration_minutes: entry.duration_minutes,
          work_date: format(new Date(entry.clock_in), 'yyyy-MM-dd'),
          notes: entry.notes
        },
        actor: {
          id: user.id,
          name: user.name || user.email,
          email: user.email
        },
        approval_notes: action === 'reject' ? approvalNotes : undefined
      };

      if (action === 'approve') {
        await approvalNotifications.notifyTimeEntryApproved(notificationData);
      } else {
        await approvalNotifications.notifyTimeEntryRejected(notificationData);
      }

      toast.success(`Time entry ${action}d successfully`);
      onApprovalChange?.();
      setApprovalNotes('');
      setShowNotesInput(false);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(`Failed to ${action} time entry`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const isPending = entry.approval_status === 'pending';

  return (
    <Card className={cn(
      "transition-all duration-200",
      isPending && "border-amber-200 dark:border-amber-800"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.user?.avatar_url} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-semibold">
                {entry.user?.name || 'Unknown Employee'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {entry.user?.email}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(entry.approval_status)}>
            {entry.approval_status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-sm text-muted-foreground">
                {formatHoursMinutes(entry.duration_minutes)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(entry.clock_in), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Time Range */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">Clock In:</span>{' '}
              {format(new Date(entry.clock_in), 'h:mm a')}
            </div>
            <div>
              <span className="font-medium">Clock Out:</span>{' '}
              {format(new Date(entry.clock_out), 'h:mm a')}
            </div>
          </div>
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Notes</p>
              <p className="text-sm text-muted-foreground">{entry.notes}</p>
            </div>
          </div>
        )}

        {/* Approval Actions */}
        {isPending && (
          <div className="pt-2 space-y-3">
            {showNotesInput && (
              <div>
                <label className="text-sm font-medium text-destructive">
                  Rejection Reason *
                </label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleApproval('approve')}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                onClick={() => {
                  if (showNotesInput) {
                    handleApproval('reject');
                  } else {
                    setShowNotesInput(true);
                  }
                }}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Approved/Rejected Info */}
        {!isPending && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {entry.approval_status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
            {entry.approved_at && format(new Date(entry.approved_at), 'MMM dd, yyyy at h:mm a')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};