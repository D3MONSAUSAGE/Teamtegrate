import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Loader2,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { uploadBatchService, UploadBatch, ValidationLog } from '@/services/UploadBatchService';
import { format, formatDistanceToNow } from 'date-fns';

interface BatchProgressCardProps {
  batchId: string;
}

export const BatchProgressCard: React.FC<BatchProgressCardProps> = ({ batchId }) => {
  const [batch, setBatch] = useState<UploadBatch | null>(null);
  const [validationLogs, setValidationLogs] = useState<ValidationLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        const [batches, logs] = await Promise.all([
          uploadBatchService.getBatches(1),
          uploadBatchService.getValidationLogs(batchId)
        ]);
        
        const currentBatch = batches.find(b => b.id === batchId);
        if (currentBatch) {
          setBatch(currentBatch);
        }
        
        setValidationLogs(logs);
      } catch (error) {
        console.error('Error fetching batch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();

    // Set up real-time subscription
    const unsubscribe = uploadBatchService.subscribeToBatchUpdates((payload) => {
      if (payload.table === 'upload_batches' && payload.new?.id === batchId) {
        setBatch(payload.new);
      }
      if (payload.table === 'data_validation_log' && payload.new?.batch_id === batchId) {
        setValidationLogs(prev => [payload.new, ...prev]);
      }
    });

    return unsubscribe;
  }, [batchId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading batch information...
        </CardContent>
      </Card>
    );
  }

  if (!batch) {
    return null;
  }

  const getStatusIcon = () => {
    switch (batch.status) {
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (batch.status) {
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="text-xs">Warning</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Info</Badge>;
    }
  };

  const progressPercentage = batch.total_files > 0 
    ? ((batch.processed_files + batch.failed_files) / batch.total_files) * 100 
    : 0;

  const unresolvedLogs = validationLogs.filter(log => !log.is_resolved);
  const criticalIssues = unresolvedLogs.filter(log => log.severity === 'critical' || log.severity === 'error');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            Batch Progress
            {batch.batch_name && (
              <span className="text-sm text-muted-foreground">({batch.batch_name})</span>
            )}
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Files Processed</span>
            <span>{batch.processed_files + batch.failed_files} of {batch.total_files}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">{batch.processed_files}</div>
            <div className="text-xs text-muted-foreground">Processed</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600">{batch.failed_files}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600">{batch.total_files}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Timing Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Started: {formatDistanceToNow(new Date(batch.created_at), { addSuffix: true })}</div>
          {batch.completed_at && (
            <div>Completed: {formatDistanceToNow(new Date(batch.completed_at), { addSuffix: true })}</div>
          )}
        </div>

        {/* Validation Issues Summary */}
        {unresolvedLogs.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Validation Issues</span>
                <Badge variant="outline" className="text-xs">
                  {unresolvedLogs.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
              >
                <Eye className="w-3 h-3 mr-1" />
                {showLogs ? 'Hide' : 'View'}
              </Button>
            </div>

            {criticalIssues.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                <AlertCircle className="w-4 h-4" />
                {criticalIssues.length} critical issues require attention
              </div>
            )}

            {showLogs && (
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {unresolvedLogs.map((log, index) => (
                    <div key={log.id} className="flex items-start gap-2 p-2 border rounded text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getSeverityBadge(log.severity)}
                        {log.field_name && (
                          <Badge variant="outline" className="text-xs">{log.field_name}</Badge>
                        )}
                        <span className="text-muted-foreground truncate">{log.message}</span>
                      </div>
                      <div className="text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Success Message */}
        {batch.status === 'completed' && batch.failed_files === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
            <CheckCircle className="w-4 h-4" />
            All files processed successfully!
          </div>
        )}
      </CardContent>
    </Card>
  );
};