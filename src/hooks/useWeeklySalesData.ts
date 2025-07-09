
import { useState, useEffect, useMemo } from 'react';
import { SalesData, WeeklySalesData, ParsedSalesData } from '@/types/sales';
import { startOfWeek, endOfWeek, format, parseISO, isSameWeek } from 'date-fns';

export const useWeeklySalesData = (salesData: SalesData[]) => {
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
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
    locations
  };
};
