import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreatedInvoice } from '@/types/invoices';
import { generateInvoicePDF } from '@/utils/generateInvoicePDF';
import { format } from 'date-fns';
import { FileDown, Building2 } from 'lucide-react';

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: CreatedInvoice;
}

export const InvoicePreviewDialog = ({ open, onOpenChange, invoice }: InvoicePreviewDialogProps) => {
  const handleDownloadPDF = () => {
    generateInvoicePDF(invoice);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
        </DialogHeader>

        <div className="bg-background border rounded-lg p-8 space-y-8">
          {/* Company Header */}
          <div className="flex items-start justify-between border-b pb-6">
            <div className="flex items-start gap-4">
              {invoice.company_logo_url ? (
                <img
                  src={invoice.company_logo_url}
                  alt="Company Logo"
                  className="h-16 w-16 object-contain"
                />
              ) : (
                <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{invoice.company_name || 'Company Name'}</h2>
                {invoice.company_address && (
                  <p className="text-sm text-muted-foreground">{invoice.company_address}</p>
                )}
                {invoice.company_phone && (
                  <p className="text-sm text-muted-foreground">{invoice.company_phone}</p>
                )}
                {invoice.company_email && (
                  <p className="text-sm text-muted-foreground">{invoice.company_email}</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <h3 className="text-2xl font-bold text-primary">INVOICE</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Invoice #: <span className="font-medium text-foreground">{invoice.invoice_number}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Issue Date: <span className="font-medium text-foreground">{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Due Date: <span className="font-medium text-foreground">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
              </p>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-2">Bill To:</h4>
            <div className="space-y-1">
              <p className="font-medium">{invoice.client?.name}</p>
              {invoice.client?.email && <p className="text-sm text-muted-foreground">{invoice.client.email}</p>}
              {invoice.client?.phone && <p className="text-sm text-muted-foreground">{invoice.client.phone}</p>}
              {invoice.client?.address && <p className="text-sm text-muted-foreground">{invoice.client.address}</p>}
              {invoice.client?.city && invoice.client?.state && (
                <p className="text-sm text-muted-foreground">
                  {invoice.client.city}, {invoice.client.state} {invoice.client.postal_code}
                </p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Description</th>
                  <th className="text-right py-2 font-semibold">Qty</th>
                  <th className="text-right py-2 font-semibold">Unit Price</th>
                  <th className="text-right py-2 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items?.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 text-sm">{item.description}</td>
                    <td className="py-3 text-sm text-right">{item.quantity}</td>
                    <td className="py-3 text-sm text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="py-3 text-sm text-right font-medium">${item.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-medium">${invoice.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Notes */}
          {(invoice.payment_terms || invoice.notes) && (
            <div className="space-y-3 pt-4 border-t">
              {invoice.payment_terms && (
                <div>
                  <p className="text-sm font-semibold">Payment Terms:</p>
                  <p className="text-sm text-muted-foreground">{invoice.payment_terms}</p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <p className="text-sm font-semibold">Notes:</p>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {invoice.footer_text && (
            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              {invoice.footer_text}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownloadPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
