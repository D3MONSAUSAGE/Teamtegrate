import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface SyncLogEntry {
  id: string;
  sync_type: string;
  status: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  meeting_request_id?: string;
  google_event_id?: string;
}

interface SyncStats {
  pending: number;
  success: number;
  failed: number;
  total: number;
}

const CalendarSyncDashboard: React.FC = () => {
  const { user } = useAuth();
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [stats, setStats] = useState<SyncStats>({ pending: 0, success: 0, failed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadSyncData();
      // Set up real-time subscription for sync updates
      const subscription = supabase
        .channel('sync-updates')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'calendar_sync_log',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Sync update received:', payload);
            loadSyncData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadSyncData = async () => {
    try {
      // Get sync logs from the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: logs, error: logsError } = await supabase
        .from('calendar_sync_log')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) {
        throw logsError;
      }

      setSyncLogs(logs || []);

      // Calculate stats
      const newStats = {
        pending: logs?.filter(log => log.status === 'pending').length || 0,
        success: logs?.filter(log => log.status === 'success').length || 0,
        failed: logs?.filter(log => log.status === 'failed').length || 0,
        total: logs?.length || 0
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error loading sync data:', error);
      toast.error('Failed to load sync data');
    } finally {
      setLoading(false);
    }
  };

  const processPendingSync = async () => {
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-calendar-sync-queue');

      if (error) {
        throw error;
      }

      const { processed = 0, errors = 0 } = data;
      toast.success(`Processed ${processed} sync operations, ${errors} errors`);
      
      // Reload data to show updates
      await loadSyncData();
    } catch (error) {
      console.error('Error processing sync queue:', error);
      toast.error('Failed to process pending syncs');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSyncTypeDisplay = (syncType: string) => {
    switch (syncType) {
      case 'export_to_google':
        return 'Export to Google';
      case 'import_from_google':
        return 'Import from Google';
      case 'update_google':
        return 'Update Google';
      case 'delete_google':
        return 'Delete from Google';
      default:
        return syncType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading sync data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Syncs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{stats.success}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {stats.pending > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Pending Syncs</h3>
                <p className="text-sm text-muted-foreground">
                  You have {stats.pending} pending sync operations
                </p>
              </div>
              <Button 
                onClick={processPendingSync}
                disabled={processing}
                size="sm"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Process Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync History
          </CardTitle>
          <CardDescription>
            Recent calendar synchronization activities (last 7 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="success">Success ({stats.success})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({stats.failed})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <SyncLogList logs={syncLogs} />
            </TabsContent>
            
            <TabsContent value="pending" className="mt-4">
              <SyncLogList logs={syncLogs.filter(log => log.status === 'pending')} />
            </TabsContent>
            
            <TabsContent value="success" className="mt-4">
              <SyncLogList logs={syncLogs.filter(log => log.status === 'success')} />
            </TabsContent>
            
            <TabsContent value="failed" className="mt-4">
              <SyncLogList logs={syncLogs.filter(log => log.status === 'failed')} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  function SyncLogList({ logs }: { logs: SyncLogEntry[] }) {
    if (logs.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No sync operations found
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(log.status)}
              <div>
                <p className="font-medium">{getSyncTypeDisplay(log.sync_type)}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </p>
                {log.error_message && (
                  <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(log.status)}
              {log.google_event_id && (
                <Badge variant="outline" className="text-xs">
                  Google ID: {log.google_event_id.substring(0, 8)}...
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
};

export default CalendarSyncDashboard;