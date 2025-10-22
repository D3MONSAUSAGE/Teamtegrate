import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { DollarSign, Calendar, CreditCard } from 'lucide-react';
import type { PaymentRecord } from '@/types/invoices';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
}

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber
}) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invoiceId) {
      fetchPayments();
    }
  }, [isOpen, invoiceId]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payment_records')
        .select('*, payment_type:payment_types(name)')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments((data as any) || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>
            Invoice #{invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No payments recorded yet
          </div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Payments</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
              </div>
            </div>

            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-lg font-semibold">{formatCurrency(payment.amount)}</span>
                    </div>
                    {payment.is_cash_payment && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-500">
                        Cash
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span>
                      {payment.payment_type && (
                        <span className="text-xs">({payment.payment_type.name})</span>
                      )}
                    </div>

                    {payment.reference_number && (
                      <div className="text-xs text-muted-foreground">
                        Ref: {payment.reference_number}
                      </div>
                    )}

                    {payment.notes && (
                      <div className="mt-2 text-xs text-muted-foreground italic">
                        {payment.notes}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Recorded: {format(new Date(payment.created_at), 'MMM dd, yyyy h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentHistoryModal;
