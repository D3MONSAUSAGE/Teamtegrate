import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Loader2, DollarSign, Building2, User, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { PaymentHistoryPanel } from "./PaymentHistoryPanel";
import { RecordPaymentDialog } from "./RecordPaymentDialog";

interface InvoiceDetailsModalProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentRecorded?: () => void;
}

interface InvoiceDetails {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_status: string;
  payment_terms: string;
  notes?: string;
  client_name: string;
  client_email?: string;
  warehouse_name: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

export function InvoiceDetailsModal({ 
  invoiceId, 
  open, 
  onOpenChange,
  onPaymentRecorded 
}: InvoiceDetailsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (invoiceId && open) {
      fetchInvoiceDetails();
    }
  }, [invoiceId, open]);

  const fetchInvoiceDetails = async () => {
    if (!invoiceId || !user?.organizationId) return;

    try {
      setLoading(true);

      // Fetch invoice with related data
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('created_invoices')
        .select(`
          *,
          invoice_clients!inner(name, email),
          warehouses!inner(name)
        `)
        .eq('id', invoiceId)
        .eq('organization_id', user.organizationId)
        .single();

      if (invoiceError) throw invoiceError;

      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('line_number', { ascending: true });

      if (lineItemsError) throw lineItemsError;

      setInvoice({
        id: invoiceData.id,
        invoice_number: invoiceData.invoice_number,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        total_amount: invoiceData.total_amount || 0,
        paid_amount: invoiceData.paid_amount || 0,
        balance_due: invoiceData.balance_due || invoiceData.total_amount || 0,
        payment_status: invoiceData.payment_status || 'unpaid',
        payment_terms: invoiceData.payment_terms || 'Net 30',
        notes: invoiceData.notes,
        client_name: invoiceData.invoice_clients?.name || 'Unknown',
        client_email: invoiceData.invoice_clients?.email,
        warehouse_name: invoiceData.warehouses?.name || 'Unknown',
        line_items: lineItems?.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total_price
        })) || []
      });
    } catch (error: any) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      paid: { variant: "default", label: "Paid" },
      partial: { variant: "secondary", label: "Partial" },
      unpaid: { variant: "outline", label: "Pending" },
      overdue: { variant: "destructive", label: "Overdue" }
    };

    const config = statusMap[status] || statusMap.unpaid;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handlePaymentSuccess = () => {
    fetchInvoiceDetails();
    onPaymentRecorded?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Invoice #{invoice.invoice_number}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(invoice.payment_status)}
                    <span className="text-sm text-muted-foreground">
                      {invoice.payment_terms}
                    </span>
                  </div>
                </div>
                {invoice.balance_due > 0 && (
                  <Button onClick={() => setShowPaymentDialog(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="h-4 w-4" />
                    Client Information
                  </div>
                  <div>
                    <p className="font-medium">{invoice.client_name}</p>
                    {invoice.client_email && (
                      <p className="text-sm text-muted-foreground">{invoice.client_email}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Warehouse
                  </div>
                  <p className="font-medium">{invoice.warehouse_name}</p>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Dates
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Issue:</span>{" "}
                      <span className="font-medium">{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Due:</span>{" "}
                      <span className="font-medium">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Payment Summary
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Total:</span>{" "}
                      <span className="font-medium">${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Paid:</span>{" "}
                      <span className="font-medium text-primary">${invoice.paid_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Balance:</span>{" "}
                      <span className="font-bold">${invoice.balance_due.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {invoice.line_items.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <h3 className="font-semibold">Line Items</h3>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Description</th>
                          <th className="text-right p-3 text-sm font-medium">Qty</th>
                          <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                          <th className="text-right p-3 text-sm font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.line_items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3 text-sm">{item.description}</td>
                            <td className="p-3 text-sm text-right">{item.quantity}</td>
                            <td className="p-3 text-sm text-right">${item.unit_price.toFixed(2)}</td>
                            <td className="p-3 text-sm text-right font-medium">${item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {invoice.notes && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
              )}

              <Separator />

              {/* Payment History */}
              <PaymentHistoryPanel invoiceId={invoice.id} />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Invoice not found
            </div>
          )}
        </DialogContent>
      </Dialog>

      {invoice && (
        <RecordPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          invoice={{
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            total_amount: invoice.total_amount,
            paid_amount: invoice.paid_amount,
            balance_due: invoice.balance_due
          } as any}
          onPaymentRecorded={handlePaymentSuccess}
        />
      )}
    </>
  );
}
