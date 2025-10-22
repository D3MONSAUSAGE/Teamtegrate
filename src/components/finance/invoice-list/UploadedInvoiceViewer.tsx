import React from 'react';
import { toast } from '@/components/ui/sonner';

interface UploadedInvoiceViewerProps {
  imageUrl: string;
  fileName: string;
  fileType: string;
  invoiceNumber: string;
}

const UploadedInvoiceViewer: React.FC<UploadedInvoiceViewerProps> = ({
  imageUrl,
  fileName,
  fileType,
  invoiceNumber
}) => {
  const isPDF = fileType.toLowerCase().includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const isImage = fileType.toLowerCase().includes('image') || 
                  /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);

  if (isPDF) {
    return (
      <div className="w-full" style={{ height: '70vh' }}>
        <iframe 
          src={imageUrl}
          className="w-full h-full border-0 rounded-lg"
          title={`Invoice ${invoiceNumber}`}
          onError={(e) => {
            console.error('Error loading PDF:', e);
            toast.error('Failed to load PDF');
          }}
        />
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="flex justify-center items-center">
        <img 
          src={imageUrl} 
          alt={`Invoice ${invoiceNumber}`}
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
          onLoad={() => console.log('Image loaded successfully')}
          onError={(e) => {
            console.error('Error loading image:', e);
            toast.error('Failed to load image');
          }}
        />
      </div>
    );
  }

  // For other file types, show a download prompt
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="text-center">
        <p className="text-lg font-medium">Preview not available</p>
        <p className="text-sm text-muted-foreground mt-2">
          This file type ({fileType}) cannot be previewed in the browser.
        </p>
        <p className="text-sm text-muted-foreground">
          Please use the Download button to view the file.
        </p>
      </div>
    </div>
  );
};

export default UploadedInvoiceViewer;
