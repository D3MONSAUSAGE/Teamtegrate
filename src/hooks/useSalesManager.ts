import { useState, useEffect, useMemo, useCallback } from 'react';
import { SalesData, WeeklySalesData } from '@/types/sales';
import { salesDataService, SalesDataFilters } from '@/services/SalesDataService';
import { startOfWeek, endOfWeek, format, parseISO, isSameWeek } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { useTeams } from '@/hooks/useTeams';

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
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => new Date());
  const [filters, setFilters] = useState<SalesDataFilters>(initialFilters);

  // Get teams data
  const { teams: teamsData } = useTeams();

  // Derived data
  const teams = useMemo(() => {
    const allOption = { id: 'all', name: 'All Teams' };
    return [allOption, ...(teamsData || [])];
  }, [teamsData]);

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

  // Weekly data calculation
  const weeklyData = useMemo((): WeeklySalesData | null => {
    console.log('[useSalesManager] Calculating weekly data. Filtered data length:', filteredSalesData.length);
    console.log('[useSalesManager] Selected week:', selectedWeek);
    console.log('[useSalesManager] Selected team:', selectedTeam);
    
    if (filteredSalesData.length === 0) {
      console.log('[useSalesManager] No filtered data available');
      return null;
    }
    
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    
    const weekSales = filteredSalesData.filter(sale => 
      isSameWeek(sale.date, selectedWeek, { weekStartsOn: 1 })
    );
    
    console.log('[useSalesManager] Week sales count:', weekSales.length);
    
    if (weekSales.length === 0) {
      const selectedTeamName = selectedTeam === 'all' ? 'All Teams' : 
        teams.find(t => t.id === selectedTeam)?.name || selectedTeam;
      console.log('[useSalesManager] No sales for selected week, returning empty data for team:', selectedTeamName);
      return {
        weekStart,
        weekEnd,
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
        }
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
      weekStart,
      weekEnd,
      location: selectedTeamName,
      dailySales: dailySalesWithStringDates,
      totals
    };
  }, [filteredSalesData, selectedWeek, selectedTeam, teams]);

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
      
      // Auto-select most recent week with data if current selection has no data
      if (data.length > 0) {
        const filteredForTeam = selectedTeam !== 'all' 
          ? data.filter(d => d.team_id === selectedTeam)
          : data;
        
        // Check if current week has data for selected team
        const currentWeekHasData = filteredForTeam.some(sale => 
          isSameWeek(parseISO(sale.date), selectedWeek, { weekStartsOn: 1 })
        );
        
        // If no data for current week, jump to most recent week with data
        if (!currentWeekHasData && filteredForTeam.length > 0) {
          const mostRecentData = filteredForTeam.reduce((latest, current) => {
            return new Date(current.date) > new Date(latest.date) ? current : latest;
          });
          console.log('[useSalesManager] Auto-selecting week with data:', mostRecentData.date);
          setSelectedWeek(parseISO(mostRecentData.date));
        }
      }
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

  // Update selected week when weeks with data changes
  useEffect(() => {
    if (weeksWithData.length > 0) {
      const currentWeekHasData = weeksWithData.some(week => 
        isSameWeek(week, selectedWeek, { weekStartsOn: 1 })
      );
      if (!currentWeekHasData) {
        setSelectedWeek(weeksWithData[0]);
      }
    }
  }, [weeksWithData, selectedWeek]);

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