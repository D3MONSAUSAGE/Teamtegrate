import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileStatus {
  fileName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  size?: number;
}

interface FileStatusCardProps {
  files: FileStatus[];
  className?: string;
}

export const FileStatusCard: React.FC<FileStatusCardProps> = ({ files, className }) => {
  if (files.length === 0) return null;

  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const processingCount = files.filter(f => f.status === 'processing').length;

  const getStatusIcon = (status: FileStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return ` (${mb.toFixed(1)}MB)`;
  };

  return (
    <Card className={cn("border-l-4", className, {
      "border-l-green-500": errorCount === 0 && successCount > 0,
      "border-l-destructive": errorCount > 0,
      "border-l-primary": processingCount > 0 && errorCount === 0
    })}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">File Processing Status</h4>
            <div className="flex gap-3 text-xs">
              {successCount > 0 && (
                <span className="text-green-500">✓ {successCount} success</span>
              )}
              {errorCount > 0 && (
                <span className="text-destructive">✗ {errorCount} failed</span>
              )}
              {processingCount > 0 && (
                <span className="text-primary">⟳ {processingCount} processing</span>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.fileName}-${index}`}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-md text-sm",
                  file.status === 'error' && "bg-destructive/5",
                  file.status === 'success' && "bg-green-500/5"
                )}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getStatusIcon(file.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {file.fileName}{formatFileSize(file.size)}
                  </p>
                  {file.error && (
                    <div className="flex items-start gap-1 mt-1 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{file.error}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
