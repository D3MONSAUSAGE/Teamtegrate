
import React from 'react';
import { Button } from "@/components/ui/button";
import { Camera, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';

interface InvoiceUploadButtonsProps {
  onCameraClick: () => void;
  onFileClick: () => void;
  isDisabled: boolean;
}

const InvoiceUploadButtons: React.FC<InvoiceUploadButtonsProps> = ({
  onCameraClick,
  onFileClick,
  isDisabled
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn("grid gap-3", isMobile ? "grid-cols-1" : "grid-cols-2")}>
      <Button
        type="button"
        onClick={onCameraClick}
        disabled={isDisabled}
        className={cn(
          "bg-blue-600 hover:bg-blue-700 text-white",
          isMobile ? "h-16 text-lg" : "h-12"
        )}
      >
        <Camera className={cn("mr-2", isMobile ? "h-6 w-6" : "h-5 w-5")} />
        {isMobile ? "Take Photo with Camera" : "Camera"}
      </Button>
      
      <Button
        type="button"
        variant="outline"
        onClick={onFileClick}
        disabled={isDisabled}
        className={cn(
          "border-2",
          isMobile ? "h-16 text-lg" : "h-12"
        )}
      >
        <FileImage className={cn("mr-2", isMobile ? "h-6 w-6" : "h-5 w-5")} />
        {isMobile ? "Choose from Gallery" : "Browse Files"}
      </Button>
    </div>
  );
};

export default InvoiceUploadButtons;
