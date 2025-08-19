import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SalesData } from '@/types/sales';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';

export interface SupabaseSalesData {
  id: string;
  user_id: string;
  organization_id: string;
  date: string;
  location: string;
  gross_sales: number;
  net_sales: number;
  order_count: number;
  order_average: number;
  labor_cost: number;
  labor_hours: number;
  labor_percentage: number;
  sales_per_labor_hour: number;
  non_cash: number;
  total_cash: number;
  calculated_cash: number;
  tips: number;
  voids?: number;
  refunds?: number;
  surcharges?: number;
  expenses?: number;
  raw_data: any;
  created_at: string;
  updated_at: string;
}

export const useSalesDataSupabase = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Supabase data to SalesData format
  const convertFromSupabase = (supabaseData: SupabaseSalesData[]): SalesData[] => {
    return supabaseData.map((data) => ({
      id: data.id,
      date: data.date,
      location: data.location,
      grossSales: data.gross_sales,
      netSales: data.net_sales,
      orderCount: data.order_count,
      orderAverage: data.order_average,
      labor: {
        cost: data.labor_cost,
        hours: data.labor_hours,
        percentage: data.labor_percentage,
        salesPerLaborHour: data.sales_per_labor_hour
      },
      paymentBreakdown: {
        nonCash: data.non_cash,
        totalCash: data.total_cash,
        calculatedCash: data.calculated_cash,
        tips: data.tips
      },
      cashManagement: data.raw_data?.cashManagement || {
        depositsAccepted: 0,
        depositsRedeemed: 0,
        paidIn: 0,
        paidOut: 0
      },
      giftCards: data.raw_data?.giftCards || {
        issueAmount: 0,
        issueCount: 0,
        reloadAmount: 0,
        reloadCount: 0
      },
      destinations: data.raw_data?.destinations || [],
      revenueItems: data.raw_data?.revenueItems || [],
      tenders: data.raw_data?.tenders || [],
      discounts: data.raw_data?.discounts || [],
      promotions: data.raw_data?.promotions || [],
      taxes: data.raw_data?.taxes || [],
      voids: data.voids,
      refunds: data.refunds,
      surcharges: data.surcharges,
      expenses: data.expenses
    }));
  };

  // Convert SalesData to Supabase format
  const convertToSupabase = (salesData: SalesData): Omit<SupabaseSalesData, 'id' | 'user_id' | 'organization_id' | 'created_at' | 'updated_at'> => {
    return {
      date: salesData.date,
      location: salesData.location,
      gross_sales: salesData.grossSales,
      net_sales: salesData.netSales,
      order_count: salesData.orderCount,
      order_average: salesData.orderAverage,
      labor_cost: salesData.labor.cost,
      labor_hours: salesData.labor.hours,
      labor_percentage: salesData.labor.percentage,
      sales_per_labor_hour: salesData.labor.salesPerLaborHour,
      non_cash: salesData.paymentBreakdown.nonCash,
      total_cash: salesData.paymentBreakdown.totalCash,
      calculated_cash: salesData.paymentBreakdown.calculatedCash,
      tips: salesData.paymentBreakdown.tips,
      voids: salesData.voids,
      refunds: salesData.refunds,
      surcharges: salesData.surcharges,
      expenses: salesData.expenses,
      raw_data: {
        cashManagement: salesData.cashManagement,
        giftCards: salesData.giftCards,
        destinations: salesData.destinations,
        revenueItems: salesData.revenueItems,
        tenders: salesData.tenders,
        discounts: salesData.discounts,
        promotions: salesData.promotions,
        taxes: salesData.taxes
      }
    };
  };

  // Fetch sales data from Supabase
  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      console.log('[useSalesDataSupabase] Fetching sales data from Supabase...');
      
      const { data, error } = await supabase
        .from('sales_data')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('[useSalesDataSupabase] Error fetching sales data:', error);
        throw error;
      }

      console.log('[useSalesDataSupabase] Fetched sales data:', data);
      const convertedData = convertFromSupabase(data || []);
      setSalesData(convertedData);
    } catch (error) {
      console.error('[useSalesDataSupabase] Failed to fetch sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new sales data
  const addSalesData = async (newSalesData: SalesData) => {
    try {
      console.log('[useSalesDataSupabase] Adding new sales data:', newSalesData);
      
      const { data: userData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userData.user?.id)
        .single();
      
      const supabaseData = {
        ...convertToSupabase(newSalesData),
        user_id: userData.user?.id,
        organization_id: userProfile?.organization_id
      };
      
      const { data, error } = await supabase
        .from('sales_data')
        .insert(supabaseData)
        .select('*')
        .single();

      if (error) {
        console.error('[useSalesDataSupabase] Error inserting sales data:', error);
        throw error;
      }

      console.log('[useSalesDataSupabase] Successfully added sales data:', data);
      
      // Update local state
      const convertedData = convertFromSupabase([data]);
      setSalesData(prev => [...convertedData, ...prev]);
      
      toast.success('Sales data saved successfully!');
      return data;
    } catch (error) {
      console.error('[useSalesDataSupabase] Failed to add sales data:', error);
      toast.error('Failed to save sales data');
      throw error;
    }
  };

  // Delete sales data
  const deleteSalesData = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sales_data')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSalesData(prev => prev.filter(item => item.id !== id));
      toast.success('Sales data deleted successfully!');
    } catch (error) {
      console.error('[useSalesDataSupabase] Failed to delete sales data:', error);
      toast.error('Failed to delete sales data');
      throw error;
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchSalesData();
  }, []);

  return {
    salesData,
    isLoading,
    addSalesData,
    deleteSalesData,
    refreshData: fetchSalesData
  };
};