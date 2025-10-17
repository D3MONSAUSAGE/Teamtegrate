import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';

interface DailySales {
  date: string;
  total_sales: number;
  collected: number;
  outstanding: number;
  invoice_count: number;
}

interface PaymentMethodBreakdown {
  payment_method: string;
  is_cash_equivalent: boolean;
  payment_count: number;
  total_amount: number;
}

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

interface WeeklySummary {
  total_sales: number;
  collected: number;
  outstanding: number;
  cash_on_hand: number;
  invoice_count: number;
  daily_breakdown: DailySales[];
  payment_methods: PaymentMethodBreakdown[];
  outstanding_invoices: OutstandingInvoice[];
}

export const useWarehouseSales = (warehouseId: string, currentWeek: Date) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);

  const fetchSales = async () => {
    if (!user?.organizationId || !warehouseId) return;

    try {
      setIsLoading(true);
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Sunday
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 }); // Saturday

      // Fetch invoices for this warehouse and week
      const { data: invoices, error: invoicesError } = await supabase
        .from('created_invoices')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('warehouse_id', warehouseId)
        .gte('issue_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('issue_date', format(weekEnd, 'yyyy-MM-dd'));

      if (invoicesError) throw invoicesError;

      // Fetch payment method breakdown
      const { data: paymentMethods, error: paymentError } = await supabase
        .from('payment_records')
        .select(`
          amount,
          payment_types!inner(name, is_cash_equivalent)
        `)
        .in('invoice_id', invoices?.map(inv => inv.id) || [])
        .gte('payment_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('payment_date', format(weekEnd, 'yyyy-MM-dd'));

      if (paymentError) throw paymentError;

      // Group payment methods
      const paymentMethodMap = new Map<string, PaymentMethodBreakdown>();
      paymentMethods?.forEach((payment: any) => {
        const methodName = payment.payment_types.name;
        const existing = paymentMethodMap.get(methodName);
        
        if (existing) {
          existing.payment_count += 1;
          existing.total_amount += payment.amount || 0;
        } else {
          paymentMethodMap.set(methodName, {
            payment_method: methodName,
            is_cash_equivalent: payment.payment_types.is_cash_equivalent,
            payment_count: 1,
            total_amount: payment.amount || 0
          });
        }
      });

      const payment_methods = Array.from(paymentMethodMap.values()).sort((a, b) => b.total_amount - a.total_amount);

      // Fetch outstanding invoices
      const { data: outstandingInvoices, error: outstandingError } = await supabase
        .from('created_invoices')
        .select(`
          id,
          invoice_number,
          issue_date,
          due_date,
          total_amount,
          paid_amount,
          balance_due,
          payment_terms,
          payment_status,
          invoice_clients!inner(name, email)
        `)
        .eq('organization_id', user.organizationId)
        .eq('warehouse_id', warehouseId)
        .gt('balance_due', 0)
        .order('due_date', { ascending: true });

      if (outstandingError) throw outstandingError;

      // Process outstanding invoices
      const outstanding_invoices: OutstandingInvoice[] = outstandingInvoices?.map((inv: any) => {
        const dueDate = new Date(inv.due_date);
        const today = new Date();
        const daysOverdue = dueDate < today 
          ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          total_amount: inv.total_amount || 0,
          paid_amount: inv.paid_amount || 0,
          balance_due: inv.balance_due || 0,
          payment_terms: inv.payment_terms || 'Net 30',
          payment_status: inv.payment_status,
          client_name: inv.invoice_clients?.name || 'Unknown',
          client_email: inv.invoice_clients?.email || '',
          days_overdue: daysOverdue
        };
      }) || [];

      // Calculate totals
      const total_sales = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const collected = invoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0;
      const outstanding = invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;
      const cash_on_hand = payment_methods
        .filter(pm => pm.is_cash_equivalent)
        .reduce((sum, pm) => sum + pm.total_amount, 0);

      // Calculate daily breakdown
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const daily_breakdown: DailySales[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayInvoices = invoices?.filter(inv => inv.issue_date === dayStr) || [];
        
        return {
          date: dayStr,
          total_sales: dayInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
          collected: dayInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
          outstanding: dayInvoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0),
          invoice_count: dayInvoices.length
        };
      });

      setSummary({
        total_sales,
        collected,
        outstanding,
        cash_on_hand,
        invoice_count: invoices?.length || 0,
        daily_breakdown,
        payment_methods,
        outstanding_invoices
      });
    } catch (error: any) {
      console.error('Error fetching warehouse sales:', error);
      toast.error('Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [warehouseId, currentWeek, user?.organizationId]);

  return {
    summary,
    isLoading,
    refetch: fetchSales
  };
};
