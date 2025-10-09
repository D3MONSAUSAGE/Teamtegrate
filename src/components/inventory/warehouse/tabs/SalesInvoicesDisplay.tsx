import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Search, DollarSign, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { CreatedInvoice } from '@/types/invoices';
import { invoiceService } from '@/services/invoiceService';
import { formatCurrency } from '@/utils/formatters';
import { generateInvoicePDF } from '@/utils/generateInvoicePDF';
import { InvoiceViewerModal } from '@/components/inventory/reports/InvoiceViewerModal';
import { toast } from 'sonner';

interface SalesInvoicesDisplayProps {
  warehouseId: string;
}

export const SalesInvoicesDisplay: React.FC<SalesInvoicesDisplayProps> = ({ warehouseId }) => {
  const [invoices, setInvoices] = useState<CreatedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<CreatedInvoice | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [warehouseId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getWarehouseSalesInvoices(warehouseId);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading sales invoices:', error);
      toast.error('Failed to load sales invoices');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const paidCount = filteredInvoices.filter(inv => inv.status === 'paid').length;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
      sent: { label: 'Sent', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-500' },
      paid: { label: 'Paid', className: 'bg-green-500/10 text-green-700 dark:text-green-500' },
      overdue: { label: 'Overdue', className: 'bg-destructive/10 text-destructive' },
      cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{filteredInvoices.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold">{paidCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales Invoices (Outgoing)</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sales invoices found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.client?.name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.total_amount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsViewerOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateInvoicePDF(invoice)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InvoiceViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        invoice={selectedInvoice}
      />
    </>
  );
};
