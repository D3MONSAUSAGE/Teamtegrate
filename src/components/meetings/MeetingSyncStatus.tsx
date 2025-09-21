import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  XCircle,
  RefreshCw,
  Calendar, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MeetingSyncStatusProps {
  meetingId: string;
  syncStatus?: 'pending' | 'synced' | 'failed' | 'not_synced';
  googleEventId?: string;
  googleMeetUrl?: string;
  className?: string;
  showActions?: boolean;
}

export const MeetingSyncStatus: React.FC<MeetingSyncStatusProps> = ({
  meetingId,
  syncStatus = 'not_synced',
  googleEventId,
  googleMeetUrl,
  className = '',
  showActions = true
}) => {
  const { isConnected } = useGoogleCalendar();
  const { manualSyncMeeting } = useMeetingRequests();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!isConnected) {
      toast.error('Google Calendar not connected');
      return;
    }

    setIsSyncing(true);
    try {
      const success = await manualSyncMeeting(meetingId, 'create');
      if (success) {
        toast.success('Meeting sync initiated successfully');
      } else {
        toast.error('Failed to initiate sync');
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      toast.error('Failed to sync meeting');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetrySync = async () => {
    if (!isConnected) {
      toast.error('Google Calendar not connected');
      return;
    }

    setIsSyncing(true);
    try {
      const success = await manualSyncMeeting(meetingId, googleEventId ? 'update' : 'create');
      if (success) {
        toast.success('Sync retry initiated successfully');
      } else {
        toast.error('Failed to initiate retry');
      }
    } catch (error) {
      console.error('Retry sync failed:', error);
      toast.error('Retry failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncStatusInfo = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: CheckCircle,
          label: 'Synced',
          variant: 'default' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
          description: 'Successfully synced to Google Calendar'
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Syncing...',
          variant: 'secondary' as const,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
          description: 'Sync to Google Calendar in progress'
        };
      case 'failed':
        return {
          icon: XCircle,
          label: 'Sync Failed',
          variant: 'destructive' as const,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
          description: 'Failed to sync to Google Calendar'
        };
      default:
        return {
          icon: Calendar,
          label: isConnected ? 'Not Synced' : 'No Google Calendar',
          variant: 'outline' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800',
          description: isConnected ? 'Not synced to Google Calendar' : 'Google Calendar not connected'
        };
    }
  };

  const statusInfo = getSyncStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (!showActions) {
    return (
      <Badge variant={statusInfo.variant} className={cn('flex items-center gap-1.5', className)}>
        <StatusIcon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  }

  return (
    <div className={cn('flex items-center justify-between gap-3 p-3 rounded-lg border', statusInfo.bgColor, className)}>
      <div className="flex items-center gap-2">
        <StatusIcon className={cn('h-4 w-4', statusInfo.color)} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium text-sm', statusInfo.color)}>
              {statusInfo.label}
            </span>
            {googleMeetUrl && (
              <a
                href={googleMeetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Google Meet
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {statusInfo.description}
          </p>
        </div>
      </div>

      {isConnected && showActions && (
        <div className="flex items-center gap-2">
          {syncStatus === 'failed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetrySync}
              disabled={isSyncing}
              className="h-7 px-2 text-xs"
            >
              <RefreshCw className={cn('h-3 w-3 mr-1', isSyncing && 'animate-spin')} />
              Retry
            </Button>
          )}
          
          {syncStatus === 'not_synced' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="h-7 px-2 text-xs"
            >
              <Calendar className={cn('h-3 w-3 mr-1', isSyncing && 'animate-pulse')} />
              Sync
            </Button>
          )}
        </div>
      )}

      {!isConnected && showActions && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.href = '/settings'}
          className="h-7 px-2 text-xs"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Connect
        </Button>
      )}
    </div>
  );
};

export default MeetingSyncStatus;