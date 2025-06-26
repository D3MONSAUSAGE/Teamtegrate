
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock, Upload } from 'lucide-react';

interface InvoiceUploadStatusProps {
  isUploading: boolean;
  hasRequiredFields: boolean;
  uploadProgress?: number;
  uploadStatus?: string;
}

const InvoiceUploadStatus: React.FC<InvoiceUploadStatusProps> = ({
  isUploading,
  hasRequiredFields,
  uploadProgress = 0,
  uploadStatus = ''
}) => {
  if (isUploading) {
    return (
      <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
          <span className="text-blue-800 dark:text-blue-200 font-medium">
            Uploading Invoice...
          </span>
        </div>
        
        {uploadProgress > 0 && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300">
              <span>{uploadStatus}</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
          </div>
        )}
        
        <div className="text-sm text-blue-700 dark:text-blue-300">
          Please wait while we securely upload and verify your invoice...
        </div>
      </div>
    );
  }

  if (uploadProgress === 100 && uploadStatus.includes('complete')) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-green-800 dark:text-green-200 font-medium">
          Upload completed successfully!
        </span>
      </div>
    );
  }

  if (uploadStatus.includes('failed')) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <span className="text-red-800 dark:text-red-200 font-medium">
          Upload failed. Please try again.
        </span>
      </div>
    );
  }

  if (!hasRequiredFields) {
    return (
      <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
        <Clock className="h-5 w-5 text-amber-600" />
        <span className="text-amber-800 dark:text-amber-200">
          Please fill in all invoice details before uploading
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200">
      <CheckCircle className="h-5 w-5 text-green-600" />
      <span className="text-gray-700 dark:text-gray-300">
        Ready to upload - drop files or click to browse
      </span>
    </div>
  );
};

export default InvoiceUploadStatus;
