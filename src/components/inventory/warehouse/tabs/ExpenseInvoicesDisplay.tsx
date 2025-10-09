import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Search, TrendingDown, FileText, Package } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import InvoiceStatusBadge from '@/components/finance/invoice-list/InvoiceStatusBadge';
import ImageViewerModal from '@/components/finance/invoice-list/ImageViewerModal';

interface ExpenseInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  branch: string;
  vendor?: {
    id: string;
    name: string;
  };
  invoice_total?: number;
  currency: string;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'void';
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploader_name: string;
  created_at: string;
}

interface ExpenseInvoicesDisplayProps {
  warehouseId: string;
}

export const ExpenseInvoicesDisplay: React.FC<ExpenseInvoicesDisplayProps> = ({ warehouseId }) => {
  const [invoices, setInvoices] = useState<ExpenseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<ExpenseInvoice | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [warehouseId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      
      // Get warehouse to find its team
      const { data: warehouse } = await supabase
        .from('warehouses')
        .select('team_id')
        .eq('id', warehouseId)
        .single();

      if (!warehouse?.team_id) {
        setInvoices([]);
        setLoading(false);
        return;
      }

      // Get all expense invoices for this warehouse's team
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          vendor:vendors(id, name)
        `)
        .eq('team_id', warehouse.team_id)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices((data || []) as any[]);
    } catch (error) {
      console.error('Error loading expense invoices:', error);
      toast.error('Failed to load expense invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoice: ExpenseInvoice) => {
    try {
      const { data } = await supabase.storage
        .from('invoices')
        .createSignedUrl(invoice.file_path, 3600);

      if (data?.signedUrl) {
        setImageUrl(data.signedUrl);
        setSelectedInvoice(invoice);
        setIsViewerOpen(true);
      } else {
        toast.error('Failed to load invoice file');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Failed to load invoice file');
    }
  };

  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredInvoices.reduce((sum, inv) => sum + (inv.invoice_total || 0), 0);
  const unpaidCount = filteredInvoices.filter(inv => inv.payment_status === 'unpaid').length;

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
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive" />
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
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unpaid</p>
                <p className="text-2xl font-bold">{unpaidCount}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expense Invoices (Incoming)</CardTitle>
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
              <p className="text-muted-foreground">No expense invoices found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Receive stock to create expense invoices
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.vendor?.name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-semibold text-destructive">
                      {formatCurrency(invoice.invoice_total || 0)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.payment_status} size="sm" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invoice.uploader_name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        invoice={selectedInvoice}
        imageUrl={imageUrl}
      />
    </>
  );
};
