import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { CreatedInvoice } from '@/types/invoices';
import { formatCurrency } from '@/utils/formatters';
import { generateInvoicePDF } from '@/utils/generateInvoicePDF';

interface InvoiceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: CreatedInvoice | null;
}

export const InvoiceViewerModal: React.FC<InvoiceViewerModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  if (!invoice) return null;

  const handleDownload = () => {
    generateInvoicePDF(invoice);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice {invoice.invoice_number}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white p-8 space-y-8 print:shadow-none">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
              <div className="mt-2 text-sm text-gray-600">
                <div>Invoice #: {invoice.invoice_number}</div>
                <div>Issue Date: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</div>
                <div>Due Date: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(invoice.total_amount)}
              </div>
              <div className="text-sm text-gray-600 capitalize">
                Status: {invoice.status}
              </div>
            </div>
          </div>

          <Separator />

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h2>
              {invoice.client && (
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="font-medium">{invoice.client.name}</div>
                  {invoice.client.email && <div>{invoice.client.email}</div>}
                  {invoice.client.phone && <div>{invoice.client.phone}</div>}
                  {invoice.client.address && <div>{invoice.client.address}</div>}
                  {invoice.client.city && invoice.client.state && (
                    <div>
                      {invoice.client.city}, {invoice.client.state} {invoice.client.postal_code}
                    </div>
                  )}
                  {invoice.client.country && <div>{invoice.client.country}</div>}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">Description</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700">Qty</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-700">Unit Price</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items?.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-2 text-gray-800">{item.description}</td>
                      <td className="py-3 px-2 text-center text-gray-800">{item.quantity}</td>
                      <td className="py-3 px-2 text-right text-gray-800">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-gray-800">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms and Notes */}
          {(invoice.payment_terms || invoice.notes) && (
            <>
              <Separator />
              <div className="space-y-4">
                {invoice.payment_terms && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Payment Terms</h3>
                    <p className="text-sm text-gray-700">{invoice.payment_terms}</p>
                  </div>
                )}
                {invoice.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-700">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          {invoice.footer_text && (
            <>
              <Separator />
              <div className="text-center text-xs text-gray-500">
                {invoice.footer_text}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};