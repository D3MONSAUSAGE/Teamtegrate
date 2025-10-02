import { useState, useEffect, useMemo, useCallback } from 'react';
import { SalesData, WeeklySalesData } from '@/types/sales';
import { salesDataService, SalesDataFilters } from '@/services/SalesDataService';
import { startOfWeek, endOfWeek, format, parseISO, isSameWeek } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { useTeamAccess } from '@/hooks/useTeamAccess';
import { useSalesChannelTransactions } from '@/hooks/useSalesChannelTransactions';

interface UseSalesManagerReturn {
  // Data
  salesData: SalesData[];
  weeklyData: WeeklySalesData | null;
  
  // Loading states
  isLoading: boolean;
  isUploading: boolean;
  
  // Week management
  selectedWeek: Date;
  setSelectedWeek: (week: Date) => void;
  weeksWithData: Date[];
  
  // Team filtering  
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  teams: Array<{id: string; name: string}>;
  
  // Data operations
  addSalesData: (data: SalesData, replaceExisting?: boolean) => Promise<void>;
  deleteSalesData: (id: string) => Promise<void>;
  deleteSalesDataByDate: (date: string, teamId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Statistics
  totalRecords: number;
  
  // Error handling
  error: string | null;
}

export const useSalesManager = (initialFilters: SalesDataFilters = {}): UseSalesManagerReturn => {
  // Core state
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering state
  const { availableTeams, isAdmin, shouldAutoSelect } = useTeamAccess();
  const [selectedTeam, setSelectedTeam] = useState<string>(() => {
    // Auto-select first team for managers with single team
    if (shouldAutoSelect && availableTeams.length === 1) {
      return availableTeams[0].id;
    }
    return 'all';
  });
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => new Date());
  const [filters, setFilters] = useState<SalesDataFilters>(initialFilters);

  // Derived data - Only show "All Teams" option for admins
  const teams = useMemo(() => {
    if (isAdmin) {
      const allOption = { id: 'all', name: 'All Teams' };
      return [allOption, ...availableTeams];
    }
    return availableTeams;
  }, [availableTeams, isAdmin]);

  const weeksWithData = useMemo(() => {
    const weeks = new Map<string, Date>();
    // Use filtered data so weeks reflect the selected team
    const dataToUse = selectedTeam === 'all' 
      ? salesData 
      : salesData.filter(sale => sale.team_id === selectedTeam);
    
    dataToUse.forEach(sale => {
      const weekStart = startOfWeek(parseISO(sale.date), { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, weekStart);
      }
    });
    return Array.from(weeks.values()).sort((a, b) => b.getTime() - a.getTime());
  }, [salesData, selectedTeam]);

  // Filtered data for weekly view
  const filteredSalesData = useMemo(() => {
    return salesData.map(item => ({
      ...item,
      date: parseISO(item.date)
    })).filter(item => 
      selectedTeam === 'all' || item.team_id === selectedTeam
    );
  }, [salesData, selectedTeam]);

  // Get channel transactions for the selected week
  const weekStart = useMemo(() => startOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);
  const weekEnd = useMemo(() => endOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);
  
  const { 
    transactions: channelTransactions,
    totalCommission,
    channelBreakdown,
    isLoading: isLoadingChannels
  } = useSalesChannelTransactions(
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd'),
    selectedTeam
  );

  // Weekly data calculation
  const weeklyData = useMemo((): WeeklySalesData | null => {
    console.log('[useSalesManager] Calculating weekly data. Filtered data length:', filteredSalesData.length);
    console.log('[useSalesManager] Selected week:', selectedWeek);
    console.log('[useSalesManager] Selected team:', selectedTeam);
    console.log('[useSalesManager] Channel commission:', totalCommission);
    
    if (filteredSalesData.length === 0) {
      console.log('[useSalesManager] No filtered data available');
      return null;
    }
    
    const weekStartDate = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekEndDate = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    
    const weekSales = filteredSalesData.filter(sale => 
      isSameWeek(sale.date, selectedWeek, { weekStartsOn: 1 })
    );
    
    console.log('[useSalesManager] Week sales count:', weekSales.length);
    
    if (weekSales.length === 0) {
      const selectedTeamName = selectedTeam === 'all' ? 'All Teams' : 
        teams.find(t => t.id === selectedTeam)?.name || selectedTeam;
      console.log('[useSalesManager] No sales for selected week, returning empty data for team:', selectedTeamName);
      return {
        weekStart: weekStartDate,
        weekEnd: weekEndDate,
        location: selectedTeamName,
        dailySales: [],
        totals: {
          nonCash: 0,
          totalCash: 0,
          grossTotal: 0,
          discount: 0,
          taxPaid: 0,
          tips: 0,
          netSales: 0,
          calculatedCash: 0,
          expenses: 0,
          totalInHouseCash: 0
        },
        channelData: totalCommission > 0 ? {
          totalCommission,
          adjustedNetSales: -totalCommission,
          channelBreakdown
        } : undefined
      };
    }
    
    // Calculate totals
    const totals = weekSales.reduce((acc, sale) => {
      const discountTotal = sale.discounts.reduce((sum, discount) => sum + discount.total, 0);
      const taxTotal = sale.taxes.reduce((sum, tax) => sum + tax.total, 0);
      const expenses = sale.expenses || 0;
      const totalInHouseCash = sale.paymentBreakdown.calculatedCash - expenses;
      
      return {
        nonCash: acc.nonCash + sale.paymentBreakdown.nonCash,
        totalCash: acc.totalCash + sale.paymentBreakdown.totalCash,
        grossTotal: acc.grossTotal + sale.grossSales,
        discount: acc.discount + discountTotal,
        taxPaid: acc.taxPaid + taxTotal,
        tips: acc.tips + sale.paymentBreakdown.tips,
        netSales: acc.netSales + sale.netSales,
        calculatedCash: acc.calculatedCash + sale.paymentBreakdown.calculatedCash,
        expenses: acc.expenses + expenses,
        totalInHouseCash: acc.totalInHouseCash + totalInHouseCash
      };
    }, {
      nonCash: 0,
      totalCash: 0,
      grossTotal: 0,
      discount: 0,
      taxPaid: 0,
      tips: 0,
      netSales: 0,
      calculatedCash: 0,
      expenses: 0,
      totalInHouseCash: 0
    });
    
    const dailySalesWithStringDates: SalesData[] = weekSales.map(sale => ({
      ...sale,
      date: format(sale.date, 'yyyy-MM-dd')
    }));
    
    const selectedTeamName = selectedTeam === 'all' ? 'All Teams' : 
      teams.find(t => t.id === selectedTeam)?.name || selectedTeam;
    
    return {
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
      location: selectedTeamName,
      dailySales: dailySalesWithStringDates,
      totals,
      channelData: totalCommission > 0 ? {
        totalCommission,
        adjustedNetSales: totals.netSales - totalCommission,
        channelBreakdown
      } : undefined
    };
  }, [filteredSalesData, selectedWeek, selectedTeam, teams, totalCommission, channelBreakdown]);

  // Data fetching
  const fetchData = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useSalesManager] Fetching sales data with filters:', filters);
      console.log('[useSalesManager] Selected team for fetch:', selectedTeam);
      const data = await salesDataService.fetchSalesData({
        ...filters,
        team_id: selectedTeam !== 'all' ? selectedTeam : undefined
      });
      
      console.log('[useSalesManager] Fetched data count:', data.length);
      setSalesData(data);
      
      // Keep the current week selection - user can navigate manually to weeks with data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sales data';
      setError(errorMessage);
      console.error('[useSalesManager] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedTeam, weeksWithData.length]);

  // CRUD operations
  const addSalesData = useCallback(async (newData: SalesData, replaceExisting: boolean = false) => {
    setIsUploading(true);
    setError(null);
    
    try {
      await salesDataService.addSalesData(newData, replaceExisting);
      // Refresh data after successful upload
      await fetchData(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add sales data';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [fetchData]);

  const deleteSalesData = useCallback(async (id: string) => {
    setError(null);
    
    try {
      await salesDataService.deleteSalesData(id);
      // Refresh data after successful deletion
      await fetchData(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete sales data';
      setError(errorMessage);
      throw err;
    }
  }, [fetchData]);

  const deleteSalesDataByDate = useCallback(async (date: string, teamId: string) => {
    setError(null);
    
    try {
      await salesDataService.deleteSalesDataByDate(date, teamId);
      // Refresh data after successful deletion
      await fetchData(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete sales data';
      setError(errorMessage);
      throw err;
    }
  }, [fetchData]);

  const refreshData = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Initialize data on mount and setup real-time subscription
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const initializeData = async () => {
      await fetchData();
      
      // Setup real-time subscription
      cleanup = salesDataService.subscribeToSalesData(
        (payload) => {
          console.log('[useSalesManager] Real-time update received');
          // Refresh data when changes occur
          fetchData(false);
        },
        filters
      );
    };
    
    initializeData();
    
    return () => {
      cleanup?.();
    };
  }, [filters]);

  // Refetch data when team selection changes
  useEffect(() => {
    console.log('[useSalesManager] Team selection changed to:', selectedTeam);
    fetchData(false);
  }, [selectedTeam, fetchData]);

  // Keep the current week selection - removed auto-jump to weeks with data

  return {
    // Data
    salesData,
    weeklyData,
    
    // Loading states
    isLoading,
    isUploading,
    
    // Week management
    selectedWeek,
    setSelectedWeek,
    weeksWithData,
    
    // Team filtering
    selectedTeam,
    setSelectedTeam,
    teams,
    
    // Data operations
    addSalesData,
    deleteSalesData,
    deleteSalesDataByDate,
    refreshData,
    
    // Statistics
    totalRecords: salesData.length,
    
    // Error handling
    error
  };
};