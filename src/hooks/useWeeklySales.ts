import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WeeklySalesSummary, CashOnHandSummary } from '@/types/invoices';
import { format } from 'date-fns';

export const useWeeklySales = (weekStart: Date, weekEnd: Date) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<WeeklySalesSummary | null>(null);
  const [cashSummary, setCashSummary] = useState<CashOnHandSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklySales = async () => {
      if (!user?.organizationId) return;

      try {
        setIsLoading(true);

        // Fetch sales summary
        const { data: salesData, error: salesError } = await supabase
          .from('weekly_sales_summary')
          .select('*')
          .eq('organization_id', user.organizationId)
          .eq('week_start', format(weekStart, 'yyyy-MM-dd'))
          .single();

        if (salesError && salesError.code !== 'PGRST116') { // Ignore no rows error
          console.error('Error fetching sales summary:', salesError);
        }

        // Fetch cash summary
        const { data: cashData, error: cashError } = await supabase
          .from('cash_on_hand_summary')
          .select('*')
          .eq('organization_id', user.organizationId)
          .eq('week_start', format(weekStart, 'yyyy-MM-dd'))
          .single();

        if (cashError && cashError.code !== 'PGRST116') {
          console.error('Error fetching cash summary:', cashError);
        }

        setSummary(salesData || null);
        setCashSummary(cashData || null);
      } catch (error) {
        console.error('Error fetching weekly sales:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklySales();
  }, [user?.organizationId, weekStart, weekEnd]);

  return {
    summary,
    cashSummary,
    isLoading
  };
};