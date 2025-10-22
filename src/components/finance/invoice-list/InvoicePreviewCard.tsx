import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { CreatedInvoice } from '@/types/invoices';

interface InvoicePreviewCardProps {
  invoice: CreatedInvoice;
}

const InvoicePreviewCard: React.FC<InvoicePreviewCardProps> = ({ invoice }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      case 'sent': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="bg-background border rounded-lg p-8 space-y-6">
      {/* Company Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          {invoice.company_logo_url && (
            <img 
              src={invoice.company_logo_url} 
              alt="Company Logo" 
              className="h-16 w-auto object-contain mb-4"
            />
          )}
          {invoice.company_name && (
            <h2 className="text-2xl font-bold">{invoice.company_name}</h2>
          )}
          {invoice.company_address && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {invoice.company_address}
            </p>
          )}
          <div className="text-sm text-muted-foreground space-y-1">
            {invoice.company_phone && <p>Phone: {invoice.company_phone}</p>}
            {invoice.company_email && <p>Email: {invoice.company_email}</p>}
          </div>
        </div>
        <div className="text-right space-y-2">
          <h1 className="text-3xl font-bold">INVOICE</h1>
          <Badge variant={getStatusColor(invoice.status)}>
            {invoice.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2">Bill To:</h3>
          <div className="text-sm space-y-1">
            <p className="font-medium">{invoice.client?.name}</p>
            {invoice.client?.email && <p>{invoice.client.email}</p>}
            {invoice.client?.phone && <p>{invoice.client.phone}</p>}
            {invoice.client?.address && (
              <p className="text-muted-foreground">
                {invoice.client.address}
                {invoice.client.city && `, ${invoice.client.city}`}
                {invoice.client.state && `, ${invoice.client.state}`}
                {invoice.client.postal_code && ` ${invoice.client.postal_code}`}
              </p>
            )}
            {invoice.client?.tax_id && (
              <p className="text-muted-foreground">Tax ID: {invoice.client.tax_id}</p>
            )}
          </div>
        </div>
        <div className="text-right space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Invoice Number:</span>
            <p className="font-semibold">{invoice.invoice_number}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Issue Date:</span>
            <p className="font-semibold">{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Due Date:</span>
            <p className="font-semibold">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>
          </div>
          {invoice.payment_terms && (
            <div>
              <span className="text-muted-foreground">Payment Terms:</span>
              <p className="font-semibold">{invoice.payment_terms}</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

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
            {invoice.line_items?.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-3">{item.description}</td>
                <td className="text-right py-3">{item.quantity}</td>
                <td className="text-right py-3">{formatCurrency(item.unit_price)}</td>
                <td className="text-right py-3 font-medium">{formatCurrency(item.total_price)}</td>
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
            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax:</span>
            <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>{formatCurrency(invoice.total_amount)}</span>
          </div>
          {invoice.paid_amount > 0 && (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Paid:</span>
                <span>-{formatCurrency(invoice.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>Balance Due:</span>
                <span>{formatCurrency(invoice.balance_due)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes and Footer */}
      {(invoice.notes || invoice.footer_text) && (
        <>
          <Separator />
          <div className="space-y-4 text-sm">
            {invoice.notes && (
              <div>
                <h4 className="font-semibold mb-1">Notes:</h4>
                <p className="text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
            {invoice.footer_text && (
              <div>
                <p className="text-muted-foreground text-center whitespace-pre-line">
                  {invoice.footer_text}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Payment Records */}
      {invoice.payment_records && invoice.payment_records.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="font-semibold mb-3">Payment History:</h4>
            <div className="space-y-2">
              {invoice.payment_records.map((payment) => (
                <div key={payment.id} className="flex justify-between text-sm bg-muted/50 p-3 rounded">
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.payment_date), 'MMM dd, yyyy')} • {payment.payment_method}
                      {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                    </p>
                  </div>
                  {payment.payment_type?.name && (
                    <Badge variant="outline">{payment.payment_type.name}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoicePreviewCard;
