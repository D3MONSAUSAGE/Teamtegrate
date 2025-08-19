
import { useState, useEffect, useMemo } from 'react';
import { SalesData, WeeklySalesData, ParsedSalesData } from '@/types/sales';
import { startOfWeek, endOfWeek, format, parseISO, isSameWeek } from 'date-fns';

export const useWeeklySalesData = (salesData: SalesData[]) => {
  // Initialize with the most recent data's week or current week
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => {
    if (salesData.length === 0) return new Date();
    // Find the most recent data and set the week to that data's week
    const mostRecentData = salesData.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
    return new Date(mostRecentData.date);
  });
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  
  // Parse dates and filter by location
  const parsedSalesData = useMemo(() => {
    return salesData.map(item => ({
      ...item,
      date: parseISO(item.date)
    })).filter(item => 
      selectedLocation === 'all' || item.location === selectedLocation
    );
  }, [salesData, selectedLocation]);
  
  // Get unique locations
  const locations = useMemo(() => {
    const uniqueLocations = [...new Set(salesData.map(item => item.location))];
    return ['all', ...uniqueLocations];
  }, [salesData]);

  // Get weeks that have data for quick navigation
  const weeksWithData = useMemo(() => {
    const weeks = new Map<string, Date>();
    salesData.forEach(sale => {
      const weekStart = startOfWeek(parseISO(sale.date), { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, weekStart);
      }
    });
    return Array.from(weeks.values()).sort((a, b) => b.getTime() - a.getTime());
  }, [salesData]);

  // Update selectedWeek when salesData changes and no week is selected yet
  useEffect(() => {
    if (salesData.length > 0 && weeksWithData.length > 0) {
      const currentWeekHasData = weeksWithData.some(week => 
        isSameWeek(week, selectedWeek, { weekStartsOn: 1 })
      );
      if (!currentWeekHasData) {
        setSelectedWeek(weeksWithData[0]); // Set to most recent week with data
      }
    }
  }, [salesData, weeksWithData, selectedWeek]);
  
  // Calculate weekly data
  const weeklyData = useMemo((): WeeklySalesData | null => {
    if (parsedSalesData.length === 0) return null;
    
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 }); // Sunday
    
    // Filter sales data for the selected week
    const weekSales = parsedSalesData.filter(sale => 
      isSameWeek(sale.date, selectedWeek, { weekStartsOn: 1 })
    );
    
    if (weekSales.length === 0) {
      return {
        weekStart,
        weekEnd,
        location: selectedLocation === 'all' ? 'All Locations' : selectedLocation,
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
    
    // Convert parsed sales back to string dates for the return type
    const dailySalesWithStringDates: SalesData[] = weekSales.map(sale => ({
      ...sale,
      date: format(sale.date, 'yyyy-MM-dd')
    }));
    
    return {
      weekStart,
      weekEnd,
      location: selectedLocation === 'all' ? 'All Locations' : selectedLocation,
      dailySales: dailySalesWithStringDates,
      totals
    };
  }, [parsedSalesData, selectedWeek, selectedLocation]);
  
  return {
    weeklyData,
    selectedWeek,
    setSelectedWeek,
    selectedLocation,
    setSelectedLocation,
    locations,
    weeksWithData,
    totalRecords: salesData.length
  };
};
