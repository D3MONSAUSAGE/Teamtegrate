import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Eye, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { CreatedInvoice } from '@/types/invoices';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { PaymentHistoryPanel } from './PaymentHistoryPanel';

interface SalesInvoicesDisplayProps {
  warehouseId: string;
}

export const SalesInvoicesDisplay: React.FC<SalesInvoicesDisplayProps> = ({ warehouseId }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<CreatedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<CreatedInvoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  const fetchInvoices = async () => {
    if (!user?.organizationId || !warehouseId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('created_invoices')
        .select(`
          *,
          client:invoice_clients(id, name)
        `)
        .eq('organization_id', user.organizationId)
        .eq('warehouse_id', warehouseId)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setInvoices((data as CreatedInvoice[]) || []);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [warehouseId, user?.organizationId]);

  const handleRecordPayment = (invoice: CreatedInvoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  const handlePaymentRecorded = () => {
    fetchInvoices();
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (paymentFilter === 'all') return true;
    return invoice.payment_status === paymentFilter;
  });

  const getPaymentStatusBadge = (invoice: CreatedInvoice) => {
    const status = invoice.payment_status;
    const paidAmount = invoice.paid_amount || 0;
    const totalAmount = invoice.total_amount || 0;

    if (status === 'paid' || paidAmount >= totalAmount) {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
    } else if (status === 'partial' && paidAmount > 0) {
      return <Badge variant="secondary" className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Partial</Badge>;
    } else if (status === 'overdue') {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const stats = {
    total: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    collected: invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
    outstanding: invoices.reduce((sum, inv) => sum + (inv.balance_due || inv.total_amount || 0), 0)
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.collected.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${stats.outstanding.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sales Invoices (Outgoing)
            </CardTitle>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {paymentFilter === 'all' 
                ? 'No sales invoices found for this warehouse'
                : `No ${paymentFilter} invoices found`
              }
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => {
                const isExpanded = expandedInvoice === invoice.id;
                const balance = invoice.balance_due || invoice.total_amount;
                const paidAmount = invoice.paid_amount || 0;
                
                return (
                  <div key={invoice.id} className="border rounded-lg">
                    <div className="flex items-center justify-between p-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">#{invoice.invoice_number}</span>
                          {getPaymentStatusBadge(invoice)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {invoice.client?.name || 'Unknown Client'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Issued: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')} • 
                          Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                        </p>
                        <div className="flex items-center gap-4 text-xs mt-2">
                          <span className="text-muted-foreground">
                            Total: <span className="font-semibold">${invoice.total_amount.toFixed(2)}</span>
                          </span>
                          {paidAmount > 0 && (
                            <span className="text-green-600">
                              Paid: <span className="font-semibold">${paidAmount.toFixed(2)}</span>
                            </span>
                          )}
                          {balance > 0 && (
                            <span className="text-orange-600">
                              Balance: <span className="font-semibold">${balance.toFixed(2)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {balance > 0 && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleRecordPayment(invoice)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Record Payment
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {isExpanded ? 'Hide' : 'Details'}
                        </Button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t p-4 bg-muted/50">
                        <PaymentHistoryPanel invoiceId={invoice.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedInvoice && (
        <RecordPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          invoice={selectedInvoice}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
};
