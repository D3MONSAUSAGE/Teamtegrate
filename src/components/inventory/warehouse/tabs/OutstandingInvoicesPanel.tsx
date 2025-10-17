import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Eye, DollarSign, AlertCircle } from "lucide-react";

interface OutstandingInvoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_terms: string;
  payment_status: string;
  client_name: string;
  client_email: string;
  days_overdue: number;
}

interface OutstandingInvoicesPanelProps {
  invoices: OutstandingInvoice[];
  onViewInvoice?: (invoiceId: string) => void;
  onRecordPayment?: (invoiceId: string) => void;
}

export function OutstandingInvoicesPanel({ 
  invoices, 
  onViewInvoice,
  onRecordPayment 
}: OutstandingInvoicesPanelProps) {
  const overdueInvoices = invoices.filter(inv => inv.days_overdue > 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance_due, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Outstanding Invoices</CardTitle>
            <p className="text-sm text-muted-foreground">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} pending payment
              {overdueInvoices.length > 0 && (
                <span className="text-destructive ml-2">
                  • {overdueInvoices.length} overdue
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-bold">${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No outstanding invoices</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  invoice.days_overdue > 0 
                    ? 'bg-destructive/5 border-destructive/20' 
                    : 'bg-card'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{invoice.client_name}</p>
                    {invoice.days_overdue > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {invoice.days_overdue} day{invoice.days_overdue !== 1 ? 's' : ''} overdue
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Invoice #{invoice.invoice_number} • Due {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {invoice.payment_terms} • Paid: ${invoice.paid_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} of ${invoice.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <p className="text-sm text-muted-foreground">Balance Due</p>
                    <p className="text-lg font-bold">
                      ${invoice.balance_due.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {onViewInvoice && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewInvoice(invoice.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    )}
                    {onRecordPayment && (
                      <Button
                        size="sm"
                        onClick={() => onRecordPayment(invoice.id)}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
