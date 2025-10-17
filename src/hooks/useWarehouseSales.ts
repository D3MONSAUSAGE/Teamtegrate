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

interface WeeklySummary {
  total_sales: number;
  collected: number;
  outstanding: number;
  cash_on_hand: number;
  invoice_count: number;
  daily_breakdown: DailySales[];
}

export const useWarehouseSales = (warehouseId: string, currentWeek: Date) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);

  const fetchSales = async () => {
    if (!user?.organizationId || !warehouseId) return;

    try {
      setIsLoading(true);
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      // Fetch invoices for this warehouse and week
      const { data: invoices, error: invoicesError } = await supabase
        .from('created_invoices')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('warehouse_id', warehouseId)
        .gte('issue_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('issue_date', format(weekEnd, 'yyyy-MM-dd'));

      if (invoicesError) throw invoicesError;

      // Fetch cash payments for this warehouse and week
      const { data: cashPayments, error: cashError } = await supabase
        .from('payment_records')
        .select(`
          amount,
          payment_types!inner(is_cash_equivalent)
        `)
        .in('invoice_id', invoices?.map(inv => inv.id) || [])
        .gte('payment_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('payment_date', format(weekEnd, 'yyyy-MM-dd'))
        .eq('payment_types.is_cash_equivalent', true);

      if (cashError) throw cashError;

      // Calculate totals
      const total_sales = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const collected = invoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0;
      const outstanding = invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0;
      const cash_on_hand = cashPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

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
        daily_breakdown
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
