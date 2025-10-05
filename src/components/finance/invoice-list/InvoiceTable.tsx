import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Download, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { format } from 'date-fns';
import type { Invoice } from '@/types/invoice';

interface InvoiceTableProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const isOverdue = (dueDate?: string, status?: string) => {
  if (!dueDate || status === 'paid' || status === 'void') return false;
  return new Date(dueDate) < new Date();
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({ 
  invoices, 
  onView, 
  onDownload, 
  onDelete,
  sortBy,
  sortDirection,
  onSort
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (invoiceToDelete) {
      onDelete(invoiceToDelete);
    }
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

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
              <SortableHeader field="invoice_number">Invoice #</SortableHeader>
              <SortableHeader field="vendor">Vendor</SortableHeader>
              <SortableHeader field="invoice_date">Invoice Date</SortableHeader>
              <SortableHeader field="total">Total</SortableHeader>
              <SortableHeader field="status">Status</SortableHeader>
              <SortableHeader field="due_date">Due Date</SortableHeader>
              <TableHead>Category</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Uploader</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const overdue = isOverdue(invoice.payment_due_date, invoice.payment_status);
              return (
                <TableRow 
                  key={invoice.id}
                  className={overdue ? 'border-l-4 border-l-destructive bg-destructive/5' : ''}
                >
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                    {invoice.reference_number && (
                      <div className="text-xs text-muted-foreground">
                        Ref: {invoice.reference_number}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {invoice.vendor?.name || (
                      <span className="text-muted-foreground italic">No vendor</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {invoice.invoice_total ? (
                      formatCurrency(invoice.invoice_total, invoice.currency)
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                    {invoice.payment_status === 'partial' && invoice.paid_amount && (
                      <div className="text-xs text-muted-foreground">
                        Paid: {formatCurrency(invoice.paid_amount, invoice.currency)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {invoice.payment_status ? (
                      <InvoiceStatusBadge status={invoice.payment_status} size="sm" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {invoice.payment_due_date ? (
                      <div className={overdue ? 'text-destructive font-semibold' : ''}>
                        {format(new Date(invoice.payment_due_date), 'MMM dd, yyyy')}
                        {overdue && (
                          <div className="text-xs">OVERDUE</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {invoice.expense_category?.name || (
                      <span className="text-muted-foreground italic">Uncategorized</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {invoice.tags && invoice.tags.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {invoice.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {invoice.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{invoice.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      {invoice.uploader_name}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(invoice)}
                        title="View invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDownload(invoice)}
                        title="Download invoice"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(invoice)}
                        title="Delete invoice"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {invoiceToDelete?.invoice_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoiceTable;
