
import React from 'react';
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';

interface InvoiceUploadStatusProps {
  isUploading: boolean;
  hasRequiredFields: boolean;
}

const InvoiceUploadStatus: React.FC<InvoiceUploadStatusProps> = ({
  isUploading,
  hasRequiredFields
}) => {
  const isMobile = useIsMobile();

  if (isUploading) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-3 py-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border",
        isMobile && "py-8"
      )}>
        <div className="animate-spin h-6 w-6 border-3 border-current border-t-transparent rounded-full" />
        <span className={cn("font-medium", isMobile ? "text-lg" : "text-base")}>
          Uploading invoice...
        </span>
      </div>
    );
  }

  if (!hasRequiredFields) {
    return (
      <div className={cn(
        "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg",
        isMobile ? "p-6" : "p-4"
      )}>
        <p className={cn("text-amber-700 dark:text-amber-300", isMobile ? "text-base" : "text-sm")}>
          Please fill in all invoice details above before uploading files.
        </p>
      </div>
    );
  }

  return null;
};

export default InvoiceUploadStatus;
