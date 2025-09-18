import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  CheckSquare, 
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  created_at: string;
  error_message?: string;
}

interface SyncStatusProps {
  isConnected: boolean;
}

export const GoogleSyncStatus: React.FC<SyncStatusProps> = ({ isConnected }) => {
  const { user } = useAuth();
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isConnected) {
      fetchSyncLogs();
    }
  }, [user, isConnected]);

  const fetchSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_sync_log')
        .select('id, sync_type, status, created_at, error_message')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Sync Status
          </CardTitle>
          <CardDescription>
            Google Calendar connection required to view sync status
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Sync Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const recentSyncs = syncLogs.slice(0, 5);
  const successCount = syncLogs.filter(log => log.status === 'success').length;
  const failureCount = syncLogs.filter(log => log.status === 'failed').length;

  const getSyncTypeIcon = (syncType: string) => {
    if (syncType.includes('task')) return CheckSquare;
    if (syncType.includes('calendar') || syncType.includes('google')) return Calendar;
    return Activity;
  };

  const getSyncTypeLabel = (syncType: string) => {
    switch (syncType) {
      case 'import_from_google':
        return 'Import Calendar Events';
      case 'import_from_google_tasks':
        return 'Import Google Tasks';
      case 'export_to_google':
        return 'Export to Google Calendar';
      case 'sync_bidirectional':
        return 'Bidirectional Sync';
      default:
        return syncType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Sync Activity
        </CardTitle>
        <CardDescription>
          Recent synchronization activity between your app and Google services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">{successCount} Successful</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">{failureCount} Failed</span>
          </div>
        </div>

        {/* Recent Activity */}
        {recentSyncs.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Recent Activity</h4>
            <div className="space-y-2">
              {recentSyncs.map((log) => {
                const IconComponent = getSyncTypeIcon(log.sync_type);
                return (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{getSyncTypeLabel(log.sync_type)}</span>
                      <Badge 
                        variant={log.status === 'success' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(log.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sync activity recorded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleSyncStatus;