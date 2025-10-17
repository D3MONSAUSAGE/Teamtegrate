import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useWarehouseSales } from "@/hooks/useWarehouseSales";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { Loader2 } from "lucide-react";
import { PaymentMethodBreakdownComponent } from "./PaymentMethodBreakdown";
import { OutstandingInvoicesPanel } from "./OutstandingInvoicesPanel";
import { InvoiceDetailsModal } from "./InvoiceDetailsModal";

interface WarehouseDailySalesDisplayProps {
  warehouseId: string;
}

export function WarehouseDailySalesDisplay({ warehouseId }: WarehouseDailySalesDisplayProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const { summary, isLoading, refetch } = useWarehouseSales(warehouseId, currentWeek);

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const handleCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setShowInvoiceModal(true);
  };

  const handleRecordPayment = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setShowInvoiceModal(true);
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 }); // Saturday

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {summary.invoice_count} invoice{summary.invoice_count !== 1 ? 's' : ''} this week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleCurrentWeek}>
            This Week
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${summary.collected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash on Hand</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.cash_on_hand.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cash equivalent payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      {summary.payment_methods && summary.payment_methods.length > 0 && (
        <PaymentMethodBreakdownComponent 
          paymentMethods={summary.payment_methods}
          totalCollected={summary.collected}
        />
      )}

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown (Sunday - Saturday)</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.daily_breakdown.length > 0 ? (
            <div className="space-y-3">
              {summary.daily_breakdown.map((day) => {
                const isToday = format(new Date(), 'yyyy-MM-dd') === day.date;
                return (
                  <div
                    key={day.date}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isToday 
                        ? 'bg-primary/5 border-primary/30' 
                        : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {format(new Date(day.date), 'EEEE, MMM dd')}
                        {isToday && (
                          <span className="ml-2 text-xs text-primary font-normal">(Today)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {day.invoice_count} invoice{day.invoice_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-8 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">Sales</p>
                        <p className="font-medium">${day.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Collected</p>
                        <p className="font-medium text-primary">${day.collected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Outstanding</p>
                        <p className="font-medium">${day.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No sales recorded for this week
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outstanding Invoices */}
      {summary.outstanding_invoices && (
        <OutstandingInvoicesPanel 
          invoices={summary.outstanding_invoices}
          onViewInvoice={handleViewInvoice}
          onRecordPayment={handleRecordPayment}
        />
      )}

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        invoiceId={selectedInvoiceId}
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
        onPaymentRecorded={refetch}
      />
    </div>
  );
}
