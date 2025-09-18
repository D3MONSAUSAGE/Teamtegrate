import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Upload, ArrowLeftRight } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GoogleTasksSyncButtonsProps {
  className?: string;
}

const GoogleTasksSyncButtons: React.FC<GoogleTasksSyncButtonsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { isConnected, importGoogleTasks, syncTasksBidirectional } = useGoogleCalendar();
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleImport = async () => {
    if (!user || !isConnected) return;
    
    setImporting(true);
    await importGoogleTasks();
    setImporting(false);
  };

  const handleBidirectionalSync = async () => {
    if (!user || !isConnected) return;
    
    setSyncing(true);
    await syncTasksBidirectional();
    setSyncing(false);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Google Tasks Sync</CardTitle>
        <CardDescription>
          Manage synchronization between your local tasks and Google Tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleImport}
          disabled={importing || syncing}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {importing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Import from Google Tasks
            </>
          )}
        </Button>

        <Button
          onClick={handleBidirectionalSync}
          disabled={importing || syncing}
          variant="default"
          size="sm"
          className="w-full"
        >
          {syncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Sync All Tasks
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GoogleTasksSyncButtons;