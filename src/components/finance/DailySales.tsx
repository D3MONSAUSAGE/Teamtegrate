
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useSalesData } from '@/hooks/useSalesData';
import { sampleSalesData, SalesData } from '@/types/sales';
import SalesUploader from './SalesUploader';
import SalesReport from './SalesReport';
import SalesDateFilter from './SalesDateFilter';

const DailySales: React.FC = () => {
  const {
    salesData,
    setSalesData,
    dateRange,
    startDate,
    endDate,
    filteredData,
    handleDateRangeChange,
    handleCustomDateChange
  } = useSalesData(sampleSalesData);
  
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
