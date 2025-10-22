import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, X } from 'lucide-react';
import type { UnifiedInvoice } from '@/types/unifiedInvoice';
import type { CreatedInvoice } from '@/types/invoices';
import InvoicePreviewCard from './InvoicePreviewCard';
import UploadedInvoiceViewer from './UploadedInvoiceViewer';

interface UnifiedInvoiceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: UnifiedInvoice | null;
  imageUrl?: string;
  invoiceData?: CreatedInvoice | null;
  onDownload: (invoice: UnifiedInvoice) => void;
}

const UnifiedInvoiceViewerModal: React.FC<UnifiedInvoiceViewerModalProps> = ({
  isOpen,
  onClose,
  invoice,
  imageUrl,
  invoiceData,
  onDownload
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (invoice) {
      onDownload(invoice);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>
                Invoice {invoice.invoice_number}
              </DialogTitle>
              <Badge variant={invoice.source === 'uploaded' ? 'secondary' : 'default'}>
                {invoice.source === 'uploaded' ? 'Uploaded' : 'Created'}
              </Badge>
              {invoice.created_data?.creation_method === 'warehouse_checkout' && (
                <Badge variant="outline">Warehouse</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {invoice.source === 'uploaded' && imageUrl ? (
            <UploadedInvoiceViewer 
              imageUrl={imageUrl}
              fileName={invoice.uploaded_data?.file_name || ''}
              fileType={invoice.uploaded_data?.file_type || ''}
              invoiceNumber={invoice.invoice_number}
            />
          ) : invoice.source === 'created' && invoiceData ? (
            <InvoicePreviewCard invoice={invoiceData} />
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading invoice data...</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedInvoiceViewerModal;
