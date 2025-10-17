import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentRecord {
  id: string;
  amount: number;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  payment_type_id: string | null;
  recorded_by: string;
  created_at: string;
  payment_types?: {
    name: string;
    is_cash_equivalent: boolean;
  } | null;
}

interface PaymentHistoryPanelProps {
  invoiceId: string;
}

export const PaymentHistoryPanel: React.FC<PaymentHistoryPanelProps> = ({ invoiceId }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [invoiceId]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select(`
          *,
          payment_types(name, is_cash_equivalent)
        `)
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments((data as PaymentRecord[]) || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading payment history...</div>;
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No payments recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Payment History ({payments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-start justify-between border-b pb-3 last:border-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">${payment.amount.toFixed(2)}</span>
                  {payment.payment_types && (
                    <Badge variant={payment.payment_types.is_cash_equivalent ? "default" : "secondary"}>
                      {payment.payment_types.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                  {payment.reference_number && ` • Ref: ${payment.reference_number}`}
                </p>
                {payment.notes && (
                  <p className="text-xs text-muted-foreground italic">{payment.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
