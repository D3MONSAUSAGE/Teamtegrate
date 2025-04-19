
import { useState, useEffect } from 'react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { SalesData, ParsedSalesData } from '@/types/sales';

type DateRangeType = 'week' | 'month' | 'custom';

export const useSalesData = (initialData: SalesData[]) => {
  const [salesData, setSalesData] = useState<SalesData[]>(initialData);
  const [parsedSalesData, setParsedSalesData] = useState<ParsedSalesData[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeType>('week');
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filteredData, setFilteredData] = useState<ParsedSalesData[]>([]);

  // Parse dates when data changes
  useEffect(() => {
    const parsed = salesData.map(item => ({
      ...item,
      date: parseISO(item.date)
    }));
    setParsedSalesData(parsed);
  }, [salesData]);

  // Filter data when date range changes
  useEffect(() => {
    const filtered = parsedSalesData.filter(item => 
      item.date >= startDate && item.date <= endDate
    );
    setFilteredData(filtered);
  }, [parsedSalesData, startDate, endDate]);

  // Handle date range changes
  const handleDateRangeChange = (range: DateRangeType) => {
    setDateRange(range);
    
    if (range === 'week') {
      setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
      setEndDate(endOfWeek(new Date(), { weekStartsOn: 1 }));
    } else if (range === 'month') {
      setStartDate(startOfMonth(new Date()));
      setEndDate(endOfMonth(new Date()));
    }
  };

  // Handle custom date range selection
  const handleCustomDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  return {
    salesData,
    setSalesData,
    dateRange,
    startDate,
    endDate,
    filteredData,
    handleDateRangeChange,
    handleCustomDateChange
  };
};
