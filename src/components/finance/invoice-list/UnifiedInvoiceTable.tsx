import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Trash2, ArrowUpDown, ArrowUp, ArrowDown, DollarSign, FileText, Warehouse, Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import PaymentHistoryModal from './PaymentHistoryModal';
import { format } from 'date-fns';
import type { UnifiedInvoice } from '@/types/unifiedInvoice';

interface UnifiedInvoiceTableProps {
  invoices: UnifiedInvoice[];
  onView: (invoice: UnifiedInvoice) => void;
  onDownload: (invoice: UnifiedInvoice) => void;
  onDelete: (invoice: UnifiedInvoice) => void;
  onRecordPayment?: (invoice: UnifiedInvoice) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const UnifiedInvoiceTable: React.FC<UnifiedInvoiceTableProps> = ({ 
  invoices, 
  onView, 
  onDownload, 
  onDelete,
  onRecordPayment,
  sortBy,
  sortDirection,
  onSort
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<UnifiedInvoice | null>(null);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<UnifiedInvoice | null>(null);

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => {
    if (!onSort) return <TableHead>{children}</TableHead>;
    
    const isSorted = sortBy === field;
    return (
      <TableHead>
        <button
          onClick={() => onSort(field)}
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          {children}
          {isSorted ? (
            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          )}
        </button>
      </TableHead>
    );
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="source">Source</SortableHeader>
              <SortableHeader field="invoice_number">Invoice #</SortableHeader>
              <SortableHeader field="invoice_date">Date</SortableHeader>
              <TableHead>Client/Vendor</TableHead>
              <SortableHeader field="origin">Origin</SortableHeader>
              <SortableHeader field="total">Total</SortableHeader>
              <SortableHeader field="paid">Paid</SortableHeader>
              <SortableHeader field="balance">Balance</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <TableHead>Payments</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Badge variant="outline" className={
                    invoice.source === 'uploaded' 
                      ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20' 
                      : 'bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-500/20'
                  }>
                    {invoice.source === 'uploaded' ? 'Uploaded' : 'Created'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  {invoice.source === 'uploaded' 
                    ? (invoice.uploaded_data?.vendor?.name || <span className="text-muted-foreground italic">No vendor</span>)
                    : invoice.created_data?.client_name
                  }
                </TableCell>
                <TableCell>
                  {invoice.source === 'uploaded' ? (
                    <Badge variant="outline">{invoice.uploaded_data?.branch}</Badge>
                  ) : invoice.created_data?.creation_method === 'warehouse_checkout' ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-500">
                      <Warehouse className="h-3 w-3 mr-1" />
                      {invoice.created_data?.warehouse_name || 'Warehouse'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-500">Manual</Badge>
                  )}
                </TableCell>
                <TableCell className="font-semibold">{formatCurrency(invoice.total_amount, invoice.currency)}</TableCell>
                <TableCell className="text-green-600 dark:text-green-500">{formatCurrency(invoice.paid_amount, invoice.currency)}</TableCell>
                <TableCell className={invoice.balance_due > 0 ? 'text-destructive font-semibold' : ''}>
                  {formatCurrency(invoice.balance_due, invoice.currency)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.payment_status as any} size="sm" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {invoice.payment_count > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setPaymentHistoryOpen(true);
                        }}
                        className="h-7 text-xs"
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        {invoice.payment_count} payment{invoice.payment_count !== 1 ? 's' : ''}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No payments</span>
                    )}
                    {invoice.source === 'created' && invoice.balance_due > 0 && onRecordPayment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRecordPayment(invoice)}
                        className="h-7 text-xs"
                        title="Record payment"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onView(invoice)} title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDownload(invoice)} title="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setInvoiceToDelete(invoice);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {invoiceToDelete?.invoice_number}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (invoiceToDelete) onDelete(invoiceToDelete);
              setDeleteDialogOpen(false);
            }} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedInvoice && (
        <PaymentHistoryModal
          isOpen={paymentHistoryOpen}
          onClose={() => setPaymentHistoryOpen(false)}
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.invoice_number}
        />
      )}
    </>
  );
};

export default UnifiedInvoiceTable;
