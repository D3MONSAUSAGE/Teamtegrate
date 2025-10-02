import React, { useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import SalesDateFilter from './SalesDateFilter';
import WeeklySalesTable from './WeeklySalesTable';
import { WeeklySalesData, SalesData } from '@/types/sales';
import { useSalesChannelTransactions } from '@/hooks/useSalesChannelTransactions';

interface SalesDateRangeViewProps {
  salesData: SalesData[];
  selectedTeam: string;
  teamName: string;
  onDeleteDay: (date: string, teamId: string) => Promise<void>;
  isLoading?: boolean;
}

const SalesDateRangeView: React.FC<SalesDateRangeViewProps> = ({
  salesData,
  selectedTeam,
  teamName,
  onDeleteDay,
  isLoading = false
}) => {
  const [dateRange, setDateRange] = React.useState<'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = React.useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [endDate, setEndDate] = React.useState<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }));

  // Get channel transactions for the selected date range
  const { 
    totalCommission,
    channelBreakdown,
    isLoading: isLoadingChannels
  } = useSalesChannelTransactions(
    format(startDate, 'yyyy-MM-dd'),
    format(endDate, 'yyyy-MM-dd'),
    selectedTeam
  );

  // Handle date range changes
  const handleDateRangeChange = (range: 'week' | 'month' | 'custom') => {
    setDateRange(range);
    
    if (range === 'week') {
      const newStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const newEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
      setStartDate(newStart);
      setEndDate(newEnd);
    } else if (range === 'month') {
      const newStart = startOfMonth(new Date());
      const newEnd = endOfMonth(new Date());
      setStartDate(newStart);
      setEndDate(newEnd);
    }
  };

  // Handle custom date selection
  const handleCustomDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Calculate aggregated data for the date range
  const rangeData = useMemo((): WeeklySalesData | null => {
    if (!salesData || salesData.length === 0) {
      return {
        weekStart: startDate,
        weekEnd: endDate,
        location: teamName,
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

    // Parse and filter sales data for date range
    const parsedSales = salesData.map(item => ({
      ...item,
      date: typeof item.date === 'string' ? parseISO(item.date) : item.date
    }));

    const rangeSales = parsedSales.filter(sale => {
      const saleDate = sale.date;
      return saleDate >= startDate && saleDate <= endDate;
    });

    // Calculate totals
    const totals = rangeSales.reduce((acc, sale) => {
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

    const dailySalesWithStringDates: SalesData[] = rangeSales.map(sale => ({
      ...sale,
      date: format(sale.date, 'yyyy-MM-dd')
    }));

    return {
      weekStart: startDate,
      weekEnd: endDate,
      location: teamName,
      dailySales: dailySalesWithStringDates,
      totals,
      channelData: totalCommission > 0 ? {
        totalCommission,
        adjustedNetSales: totals.netSales - totalCommission,
        channelBreakdown
      } : undefined
    };
  }, [salesData, startDate, endDate, teamName, totalCommission, channelBreakdown]);

  return (
    <div className="space-y-4">
      <SalesDateFilter
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        startDate={startDate}
        endDate={endDate}
        onCustomDateChange={handleCustomDateChange}
      />
      
      <WeeklySalesTable
        weeklyData={rangeData}
        onDeleteDay={onDeleteDay}
        isLoading={isLoading || isLoadingChannels}
        displayMode={dateRange === 'week' ? 'weekly' : 'daily'}
        dateRange={{ start: startDate, end: endDate }}
      />
    </div>
  );
};

export default SalesDateRangeView;
