
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  branch: string;
  uploader_name: string;
  invoice_date: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
}

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  imageUrl: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  invoice,
  imageUrl
}) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice?.invoice_number} - {invoice?.file_name}
          </DialogTitle>
        </DialogHeader>
        {imageUrl && (
          <div className="flex justify-center">
            <img 
              src={imageUrl} 
              alt={`Invoice ${invoice?.invoice_number}`}
              className="max-w-full max-h-[70vh] object-contain"
              onLoad={() => console.log('Image loaded successfully')}
              onError={(e) => {
                console.error('Error loading image:', e);
                toast.error('Failed to load image');
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewerModal;
