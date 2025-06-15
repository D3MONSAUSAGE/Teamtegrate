
import React from 'react';
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';

interface InvoiceUploadDropzoneProps {
  getRootProps: () => any;
  getInputProps: () => any;
  isDragActive: boolean;
  isDisabled: boolean;
}

const InvoiceUploadDropzone: React.FC<InvoiceUploadDropzoneProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  isDisabled
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        isDisabled && "opacity-50 pointer-events-none",
        isMobile ? "p-8 min-h-[120px]" : "p-6"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <Upload className={cn("text-muted-foreground", isMobile ? "h-10 w-10" : "h-8 w-8")} />
        <div className="space-y-2">
          <p className={cn("font-medium", isMobile ? "text-lg" : "text-sm")}>
            {isDragActive ? "Drop the file here..." : "Drag & drop files here"}
          </p>
          <p className={cn("text-muted-foreground", isMobile ? "text-base" : "text-xs")}>
            Supports PDF, PNG, JPG, JPEG, WEBP
          </p>
          <p className={cn("text-muted-foreground", isMobile ? "text-sm" : "text-xs")}>
            or use the buttons above
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceUploadDropzone;
