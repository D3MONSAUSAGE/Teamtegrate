import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Calendar, 
  CheckSquare, 
  Download, 
  RefreshCw, 
  Clock,
  Users,
  AlertCircle
} from 'lucide-react';

interface ImportStats {
  meetings?: number;
  tasks?: number;
  events?: number;
  lastSync?: Date;
}

interface ImportFromGoogleCalendarProps {
  variant?: 'button' | 'card' | 'compact';
  importType?: 'all' | 'meetings' | 'tasks' | 'events';
  showStats?: boolean;
  onImportComplete?: (stats: ImportStats) => void;
}

export const ImportFromGoogleCalendar: React.FC<ImportFromGoogleCalendarProps> = ({
  variant = 'button',
  importType = 'all',
  showStats = false,
  onImportComplete
}) => {
  const { user } = useAuth();
  const { isConnected, importGoogleTasks, syncTasksBidirectional } = useGoogleCalendar();
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats>({});

  const importFromGoogleCalendar = async () => {
    if (!user || !isConnected) {
      toast.error('Please connect your Google Calendar first');
      return;
    }

    setImporting(true);
    let totalStats: ImportStats = {};

    try {
      toast.info('Starting Google Calendar import...');

      // Import calendar events/meetings
      if (importType === 'all' || importType === 'meetings' || importType === 'events') {
        try {
          const { data: importResult, error: calendarError } = await supabase.functions.invoke('import-from-google-calendar', {
            body: { 
              userId: user.id,
              timeMin: new Date().toISOString(),
              timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Next 30 days
            }
          });

          if (calendarError) throw calendarError;

          totalStats.meetings = importResult?.imported || 0;
          totalStats.events = importResult?.total || 0;
        } catch (error) {
          console.error('Calendar import error:', error);
          toast.error('Failed to import calendar events');
        }
      }

      // Import Google Tasks
      if (importType === 'all' || importType === 'tasks') {
        try {
          await importGoogleTasks();
          // The hook already shows success/error toasts
        } catch (error) {
          console.error('Tasks import error:', error);
        }
      }

      totalStats.lastSync = new Date();
      setImportStats(totalStats);
      onImportComplete?.(totalStats);

      if (totalStats.meetings || totalStats.tasks) {
        toast.success(`Import completed! ${totalStats.meetings || 0} meetings and ${totalStats.tasks || 0} tasks imported.`);
      } else {
        toast.info('Import completed. No new items found.');
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import from Google Calendar');
    } finally {
      setImporting(false);
    }
  };

  const importFullSync = async () => {
    if (!user || !isConnected) {
      toast.error('Please connect your Google Calendar first');
      return;
    }

    setImporting(true);

    try {
      toast.info('Starting full bidirectional sync...');
      await syncTasksBidirectional();
      await importFromGoogleCalendar();
      
      toast.success('Full sync completed successfully!');
    } catch (error) {
      console.error('Full sync error:', error);
      toast.error('Failed to complete full sync');
    } finally {
      setImporting(false);
    }
  };

  if (!isConnected) {
    if (variant === 'card') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Google Calendar Not Connected
            </CardTitle>
            <CardDescription>
              Connect your Google Calendar to import events, meetings, and tasks.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }
    return null;
  }

  const getButtonContent = () => {
    if (importing) {
      return (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Importing...
        </>
      );
    }

    switch (importType) {
      case 'meetings':
        return (
          <>
            <Users className="h-4 w-4" />
            Import Meetings
          </>
        );
      case 'tasks':
        return (
          <>
            <CheckSquare className="h-4 w-4" />
            Import Tasks
          </>
        );
      case 'events':
        return (
          <>
            <Calendar className="h-4 w-4" />
            Import Events
          </>
        );
      default:
        return (
          <>
            <Download className="h-4 w-4" />
            Import from Google Calendar
          </>
        );
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={importFromGoogleCalendar}
          disabled={importing}
        >
          {getButtonContent()}
        </Button>
        {showStats && importStats.lastSync && (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {importStats.lastSync.toLocaleTimeString()}
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Google Calendar Import
          </CardTitle>
          <CardDescription>
            Import your Google Calendar events, meetings, and tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={importFromGoogleCalendar}
              disabled={importing}
              className="flex items-center gap-2"
            >
              {getButtonContent()}
            </Button>
            
            <Button
              variant="outline"
              onClick={importFullSync}
              disabled={importing}
              className="flex items-center gap-2"
            >
              {importing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Full Sync
                </>
              )}
            </Button>
          </div>

          {showStats && importStats.lastSync && (
            <div className="pt-3 border-t space-y-2">
              <div className="text-sm font-medium">Last Import</div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {importStats.lastSync.toLocaleString()}
                </div>
                {importStats.meetings !== undefined && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {importStats.meetings} meetings
                  </div>
                )}
                {importStats.tasks !== undefined && (
                  <div className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {importStats.tasks} tasks
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default button variant
  return (
    <Button
      variant="outline"
      onClick={importFromGoogleCalendar}
      disabled={importing}
    >
      {getButtonContent()}
    </Button>
  );
};

export default ImportFromGoogleCalendar;