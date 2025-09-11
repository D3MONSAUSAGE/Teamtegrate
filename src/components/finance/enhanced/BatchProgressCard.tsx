import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  X,
  Activity,
  Loader2
} from 'lucide-react';
import { UploadBatch } from '@/services/UploadBatchService';
import { format } from 'date-fns';

interface BatchProgressCardProps {
  batch: UploadBatch;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export const BatchProgressCard: React.FC<BatchProgressCardProps> = ({
  batch,
  onCancel,
  showCancelButton = false
}) => {
  const progressPercentage = batch.total_files > 0 
    ? ((batch.processed_files + batch.failed_files) / batch.total_files) * 100 
    : 0;

  const isCompleted = batch.status === 'completed' || batch.status === 'failed';
  const isProcessing = batch.status === 'processing';

  const getStatusColor = () => {
    switch (batch.status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = () => {
    switch (batch.status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      case 'processing': return <Loader2 className="w-4 h-4 animate-spin" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {batch.batch_name || `Batch ${batch.id.slice(0, 8)}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1 capitalize">{batch.status}</span>
            </Badge>
            {showCancelButton && isProcessing && onCancel && (
              <Button size="sm" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing files...</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-600">
              <FileText className="w-5 h-5" />
              {batch.total_files}
            </div>
            <p className="text-xs text-muted-foreground">Total Files</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              {batch.processed_files}
            </div>
            <p className="text-xs text-muted-foreground">Processed</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
              <AlertCircle className="w-5 h-5" />
              {batch.failed_files}
            </div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t pt-3 space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Started: {format(new Date(batch.created_at), 'MMM dd, yyyy HH:mm')}</span>
          </div>
          {batch.completed_at && (
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>
                {batch.status === 'completed' ? 'Completed' : 'Ended'}: {format(new Date(batch.completed_at), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
          )}
        </div>

        {/* Success Rate */}
        {isCompleted && batch.total_files > 0 && (
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Success Rate</span>
              <Badge variant="outline">
                {Math.round((batch.processed_files / batch.total_files) * 100)}%
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};