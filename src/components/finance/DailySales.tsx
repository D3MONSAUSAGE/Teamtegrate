
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesUploader from './SalesUploader';
import SalesReport from './SalesReport';
import SalesDateFilter from './SalesDateFilter';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

export interface SalesData {
  id: string;
  date: string;
  location: string;
  grossSales: number;
  netSales: number;
  orderCount: number;
  orderAverage: number;
  destinations: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  revenueItems: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  tenders: {
    name: string;
    quantity: number;
    payments: number;
    tips: number;
    total: number;
    percent: number;
  }[];
  discounts: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  promotions: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  taxes: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
}

export interface ParsedSalesData {
  id: string;
  date: Date;
  location: string;
  grossSales: number;
  netSales: number;
  orderCount: number;
  orderAverage: number;
  destinations: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  revenueItems: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  tenders: {
    name: string;
    quantity: number;
    payments: number;
    tips: number;
    total: number;
    percent: number;
  }[];
  discounts: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  promotions: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
  taxes: {
    name: string;
    quantity: number;
    total: number;
    percent: number;
  }[];
}

// Sample data to demonstrate functionality
const sampleData: SalesData[] = [
  {
    id: '1',
    date: '2025-02-23',
    location: 'Santa Clarita',
    grossSales: 9545.49,
    netSales: 8684.61,
    orderCount: 291,
    orderAverage: 29.84,
    destinations: [
      { name: 'Drive Thru', quantity: 257, total: 7642.24, percent: 88.00 },
      { name: 'DoorDash', quantity: 17, total: 590.25, percent: 6.80 },
      { name: 'Online Ordering', quantity: 5, total: 210.20, percent: 2.42 },
      { name: 'Dine In', quantity: 7, total: 129.59, percent: 1.49 },
      { name: 'KIOSK- Dine In', quantity: 4, total: 95.88, percent: 1.10 },
      { name: 'KIOSK- Take Out', quantity: 1, total: 16.45, percent: 0.19 }
    ],
    revenueItems: [
      { name: 'COMBO', quantity: 111, total: 1675.84, percent: 19.30 },
      { name: 'TACOS', quantity: 360, total: 1192.05, percent: 13.73 },
      { name: 'RED TACOS', quantity: 175, total: 868.72, percent: 10.00 },
      { name: 'FRIES GUANATOS', quantity: 67, total: 786.57, percent: 9.06 },
      { name: 'GUANATOS TACOS', quantity: 127, total: 643.89, percent: 7.41 },
      { name: 'DRINKS', quantity: 193, total: 616.70, percent: 7.10 }
    ],
    tenders: [
      { name: 'Visa', quantity: 136, payments: 4273.02, tips: 91.30, total: 4364.32, percent: 45.24 },
      { name: 'Cash', quantity: 62, payments: 1471.74, tips: 0.00, total: 1471.74, percent: 15.26 },
      { name: 'MasterCard', quantity: 40, payments: 1417.79, tips: 31.98, total: 1449.77, percent: 15.03 },
      { name: 'UberEats', quantity: 22, payments: 700.34, tips: 0.00, total: 700.34, percent: 7.26 },
      { name: 'EXT DoorDash', quantity: 17, payments: 646.32, tips: 0.00, total: 646.32, percent: 6.70 }
    ],
    discounts: [
      { name: '% Discount', quantity: 1, total: 11.95, percent: 38.74 },
      { name: '$ Discount', quantity: 1, total: 10.00, percent: 32.41 },
      { name: 'Employee 30%', quantity: 2, total: 6.26, percent: 20.29 },
      { name: 'Employee 10%', quantity: 1, total: 2.64, percent: 8.56 }
    ],
    promotions: [
      { name: '$5 OFF over $30', quantity: 1, total: 5.00, percent: 100.00 }
    ],
    taxes: [
      { name: 'Sales Tax', quantity: 1379, total: 825.03, percent: 100.00 }
    ]
  },
  {
    id: '2',
    date: '2025-02-24',
    location: 'Santa Clarita',
    grossSales: 8645.23,
    netSales: 7823.12,
    orderCount: 263,
    orderAverage: 31.24,
    destinations: [
      { name: 'Drive Thru', quantity: 230, total: 6721.45, percent: 85.92 },
      { name: 'DoorDash', quantity: 14, total: 510.25, percent: 6.52 },
      { name: 'Online Ordering', quantity: 8, total: 320.20, percent: 4.09 },
      { name: 'Dine In', quantity: 10, total: 209.59, percent: 2.68 },
      { name: 'KIOSK- Dine In', quantity: 1, total: 45.88, percent: 0.59 }
    ],
    revenueItems: [
      { name: 'COMBO', quantity: 100, total: 1520.84, percent: 19.44 },
      { name: 'TACOS', quantity: 330, total: 1102.05, percent: 14.09 },
      { name: 'RED TACOS', quantity: 160, total: 808.72, percent: 10.34 },
      { name: 'FRIES GUANATOS', quantity: 60, total: 716.57, percent: 9.16 },
      { name: 'GUANATOS TACOS', quantity: 110, total: 583.89, percent: 7.46 },
      { name: 'DRINKS', quantity: 180, total: 586.70, percent: 7.50 }
    ],
    tenders: [
      { name: 'Visa', quantity: 120, payments: 3973.02, tips: 85.30, total: 4058.32, percent: 46.94 },
      { name: 'Cash', quantity: 58, payments: 1271.74, tips: 0.00, total: 1271.74, percent: 14.71 },
      { name: 'MasterCard', quantity: 35, payments: 1217.79, tips: 28.98, total: 1246.77, percent: 14.42 },
      { name: 'UberEats', quantity: 20, payments: 650.34, tips: 0.00, total: 650.34, percent: 7.52 },
      { name: 'EXT DoorDash', quantity: 15, payments: 596.32, tips: 0.00, total: 596.32, percent: 6.90 }
    ],
    discounts: [
      { name: '% Discount', quantity: 1, total: 10.95, percent: 39.10 },
      { name: '$ Discount', quantity: 1, total: 9.00, percent: 32.14 },
      { name: 'Employee 30%', quantity: 1, total: 3.26, percent: 11.64 },
      { name: 'Employee 10%', quantity: 2, total: 4.80, percent: 17.14 }
    ],
    promotions: [
      { name: '$5 OFF over $30', quantity: 1, total: 5.00, percent: 100.00 }
    ],
    taxes: [
      { name: 'Sales Tax', quantity: 1230, total: 775.03, percent: 100.00 }
    ]
  },
  {
    id: '3',
    date: '2025-02-25',
    location: 'Santa Clarita',
    grossSales: 9845.73,
    netSales: 8933.42,
    orderCount: 305,
    orderAverage: 30.52,
    destinations: [
      { name: 'Drive Thru', quantity: 268, total: 7842.24, percent: 87.79 },
      { name: 'DoorDash', quantity: 18, total: 610.25, percent: 6.83 },
      { name: 'Online Ordering', quantity: 7, total: 250.20, percent: 2.80 },
      { name: 'Dine In', quantity: 8, total: 149.59, percent: 1.67 },
      { name: 'KIOSK- Dine In', quantity: 3, total: 65.88, percent: 0.74 },
      { name: 'KIOSK- Take Out', quantity: 1, total: 15.26, percent: 0.17 }
    ],
    revenueItems: [
      { name: 'COMBO', quantity: 120, total: 1785.84, percent: 20.00 },
      { name: 'TACOS', quantity: 370, total: 1230.05, percent: 13.77 },
      { name: 'RED TACOS', quantity: 185, total: 888.72, percent: 9.95 },
      { name: 'FRIES GUANATOS', quantity: 72, total: 816.57, percent: 9.14 },
      { name: 'GUANATOS TACOS', quantity: 135, total: 673.89, percent: 7.54 },
      { name: 'DRINKS', quantity: 200, total: 646.70, percent: 7.24 }
    ],
    tenders: [
      { name: 'Visa', quantity: 146, payments: 4373.02, tips: 97.30, total: 4470.32, percent: 45.40 },
      { name: 'Cash', quantity: 67, payments: 1561.74, tips: 0.00, total: 1561.74, percent: 15.86 },
      { name: 'MasterCard', quantity: 45, payments: 1517.79, tips: 36.98, total: 1554.77, percent: 15.79 },
      { name: 'UberEats', quantity: 25, payments: 740.34, tips: 0.00, total: 740.34, percent: 7.52 },
      { name: 'EXT DoorDash', quantity: 18, payments: 676.32, tips: 0.00, total: 676.32, percent: 6.87 }
    ],
    discounts: [
      { name: '% Discount', quantity: 2, total: 20.95, percent: 45.53 },
      { name: '$ Discount', quantity: 1, total: 12.00, percent: 26.07 },
      { name: 'Employee 30%', quantity: 3, total: 9.26, percent: 20.12 },
      { name: 'Employee 10%', quantity: 1, total: 3.84, percent: 8.35 }
    ],
    promotions: [
      { name: '$5 OFF over $30', quantity: 2, total: 10.00, percent: 100.00 }
    ],
    taxes: [
      { name: 'Sales Tax', quantity: 1450, total: 865.03, percent: 100.00 }
    ]
  }
];

type DateRangeType = 'week' | 'month' | 'custom';

const DailySales: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData[]>(sampleData);
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
    // For custom range, the dates will be set by the date picker component
  };
  
  // Handle custom date range selection
  const handleCustomDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };
  
  // Handle new sales data upload
  const handleSalesDataUpload = (newData: SalesData) => {
    setSalesData(prevData => [...prevData, newData]);
    toast.success("Sales data uploaded successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Daily Sales</h2>
          <p className="text-sm text-muted-foreground">
            Track and analyze your daily sales data
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sales Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="report" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="report">Sales Report</TabsTrigger>
              <TabsTrigger value="upload">Upload Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="report" className="space-y-4">
              <SalesDateFilter 
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                startDate={startDate}
                endDate={endDate}
                onCustomDateChange={handleCustomDateChange}
              />
              
              <SalesReport 
                data={filteredData}
                startDate={startDate}
                endDate={endDate}
              />
            </TabsContent>
            
            <TabsContent value="upload">
              <SalesUploader onUpload={handleSalesDataUpload} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailySales;
