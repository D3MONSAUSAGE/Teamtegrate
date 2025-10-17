import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Eye, Loader2, DollarSign, FileText, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { InvoiceDetailsModal } from "./InvoiceDetailsModal";
import type { CreatedInvoice } from '@/types/invoices';

interface SalesInvoicesDisplayProps {
  warehouseId: string;
}

export function SalesInvoicesDisplay({ warehouseId }: SalesInvoicesDisplayProps) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<CreatedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const fetchInvoices = async () => {
    if (!user?.organizationId || !warehouseId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('created_invoices')
        .select(`
          *,
          invoice_clients!inner(name, email)
        `)
        .eq('organization_id', user.organizationId)
        .eq('warehouse_id', warehouseId)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      
      const mappedInvoices = data?.map((inv: any) => ({
        ...inv,
        client_name: inv.invoice_clients?.name || 'Unknown'
      })) || [];
      
      setInvoices(mappedInvoices as any);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [warehouseId, user?.organizationId]);

  const handleViewDetails = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setShowInvoiceModal(true);
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (paymentFilter === 'all') return true;
    return invoice.payment_status === paymentFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string; icon: any }> = {
      paid: { variant: "default", label: "Paid", icon: CheckCircle },
      partial: { variant: "secondary", label: "Partial", icon: Clock },
      unpaid: { variant: "outline", label: "Pending", icon: Clock },
      overdue: { variant: "destructive", label: "Overdue", icon: AlertCircle }
    };

    const config = statusMap[status] || statusMap.unpaid;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const stats = {
    totalRevenue: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    collected: invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
    outstanding: invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{invoices.length} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${stats.collected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalRevenue > 0 ? ((stats.collected / stats.totalRevenue) * 100).toFixed(1) : 0}% collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending payment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales Invoices (Outgoing)</CardTitle>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Invoices</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {paymentFilter === "all" ? "No sales invoices found" : `No ${paymentFilter} invoices`}
              </p>
              <p className="text-sm">
                {paymentFilter === "all" 
                  ? "Create invoices to track your warehouse sales"
                  : "Try changing the filter"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium">Invoice #{invoice.invoice_number}</p>
                      {getStatusBadge(invoice.payment_status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{(invoice as any).client_name || 'Unknown Client'}</span>
                      <span>•</span>
                      <span>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</span>
                      <span>•</span>
                      <span className="font-medium text-foreground">
                        ${invoice.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {invoice.balance_due > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Paid: </span>
                        <span className="font-medium text-primary">${invoice.paid_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className="text-muted-foreground mx-2">•</span>
                        <span className="text-muted-foreground">Balance Due: </span>
                        <span className="font-medium">${invoice.balance_due.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(invoice.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceDetailsModal
        invoiceId={selectedInvoiceId}
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
        onPaymentRecorded={fetchInvoices}
      />
    </div>
  );
}
