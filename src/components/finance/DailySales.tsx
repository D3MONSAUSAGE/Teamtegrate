
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useSalesData } from '@/hooks/useSalesData';
import { useWeeklySalesData } from '@/hooks/useWeeklySalesData';
import { useSalesDataSupabase } from '@/hooks/useSalesDataSupabase';
import { SalesData } from '@/types/sales';
import EnhancedSalesUploader from './EnhancedSalesUploader';
import SalesReport from './SalesReport';
import SalesDateFilter from './SalesDateFilter';
import WeeklySalesTable from './WeeklySalesTable';
import { format, addWeeks, subWeeks, endOfWeek } from 'date-fns';

const DailySales: React.FC = () => {
  const {
    salesData: supabaseSalesData,
    isLoading,
    addSalesData,
    deleteSalesData,
    refreshData
  } = useSalesDataSupabase();

  const {
    salesData,
    setSalesData,
    dateRange,
    startDate,
    endDate,
    filteredData,
    handleDateRangeChange,
    handleCustomDateChange
  } = useSalesData(supabaseSalesData);
  
  const {
    weeklyData,
    selectedWeek,
    setSelectedWeek,
    selectedLocation,
    setSelectedLocation,
    locations,
    weeksWithData,
    totalRecords
  } = useWeeklySalesData(salesData);
  
  const handleSalesDataUpload = async (newData: SalesData) => {
    console.log('[DailySales] Uploading new sales data:', newData);
    try {
      await addSalesData(newData);
      // Data will be automatically updated via the hook
    } catch (error) {
      console.error('[DailySales] Error uploading sales data:', error);
      // Error toast is handled in the hook
    }
  };

  const handleExportWeekly = () => {
    if (!weeklyData) {
      toast.error("No weekly data to export");
      return;
    }
    
    // Create CSV content
    const headers = [
      'Day', 'Non Cash', 'Total Cash', 'Gross Total', 'Discount', 
      'Tax Paid', 'Tips', 'Net Sales', 'Calculated Cash', 'Expenses', 'Total In-House Cash'
    ];
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const csvContent = [
      headers.join(','),
      ...days.map(day => {
        const dailySale = weeklyData.dailySales.find(sale => 
          format(new Date(sale.date), 'EEEE') === day
        );
        
        if (!dailySale) {
          return `${day},0,0,0,0,0,0,0,0,0,0`;
        }
        
        const discount = dailySale.discounts.reduce((sum, d) => sum + d.total, 0);
        const tax = dailySale.taxes.reduce((sum, t) => sum + t.total, 0);
        const expenses = dailySale.expenses || 0;
        const totalInHouseCash = dailySale.paymentBreakdown.calculatedCash - expenses;
        
        return [
          day,
          dailySale.paymentBreakdown.nonCash,
          dailySale.paymentBreakdown.totalCash,
          dailySale.grossSales,
          discount,
          tax,
          dailySale.paymentBreakdown.tips,
          dailySale.netSales,
          dailySale.paymentBreakdown.calculatedCash,
          expenses,
          totalInHouseCash
        ].join(',');
      }),
      // Add totals row
      [
        'TOTAL',
        weeklyData.totals.nonCash,
        weeklyData.totals.totalCash,
        weeklyData.totals.grossTotal,
        weeklyData.totals.discount,
        weeklyData.totals.taxPaid,
        weeklyData.totals.tips,
        weeklyData.totals.netSales,
        weeklyData.totals.calculatedCash,
        weeklyData.totals.expenses,
        weeklyData.totals.totalInHouseCash
      ].join(',')
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-sales-${format(weeklyData.weekStart, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Weekly report exported successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Daily Sales Management</h2>
          <p className="text-sm text-muted-foreground">
            Upload, analyze, and track your daily sales data with weekly reporting
          </p>
        </div>
        <Button
          onClick={refreshData}
          variant="outline"
          disabled={isLoading}
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sales Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="weekly">Weekly View</TabsTrigger>
              <TabsTrigger value="daily">Daily Report</TabsTrigger>
              <TabsTrigger value="upload">Upload Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="weekly" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading sales data...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {/* Data Summary */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex flex-col sm:flex-row gap-4 text-sm">
                        <span className="font-medium">
                          Total Records: {totalRecords}
                        </span>
                        <span>
                          Selected Week: {format(selectedWeek, 'MMM dd')} - {format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                        </span>
                        <span>
                          Weeks with Data: {weeksWithData.length}
                        </span>
                      </div>
                    </div>

                    {/* Week Navigation */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWeek(new Date())}
                          >
                            Current Week
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Quick navigation to weeks with data */}
                        {weeksWithData.length > 0 && (
                          <Select 
                            value={format(selectedWeek, 'yyyy-MM-dd')} 
                            onValueChange={(value) => setSelectedWeek(new Date(value))}
                          >
                            <SelectTrigger className="w-52">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="Jump to week..." />
                            </SelectTrigger>
                            <SelectContent>
                              {weeksWithData.map(week => (
                                <SelectItem key={format(week, 'yyyy-MM-dd')} value={format(week, 'yyyy-MM-dd')}>
                                  {format(week, 'MMM dd')} - {format(endOfWeek(week, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map(location => (
                              <SelectItem key={location} value={location}>
                                {location === 'all' ? 'All Locations' : location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button onClick={handleExportWeekly} variant="outline" size="sm" disabled={!weeklyData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Weekly Report
                      </Button>
                    </div>
                  </div>
                  
                  {weeklyData && weeklyData.dailySales.length > 0 ? (
                    <WeeklySalesTable weeklyData={weeklyData} />
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center space-y-4">
                        <div>
                          <p className="text-muted-foreground">
                            No sales data found for {format(selectedWeek, 'MMM dd')} - {format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                            {selectedLocation !== 'all' && ` at ${selectedLocation}`}
                          </p>
                          {totalRecords > 0 ? (
                            <div className="mt-4 space-y-2">
                              <p className="text-sm text-muted-foreground">
                                You have {totalRecords} sales records uploaded.
                              </p>
                              {weeksWithData.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-center">
                                  <span className="text-sm text-muted-foreground">Jump to a week with data:</span>
                                  {weeksWithData.slice(0, 3).map(week => (
                                    <Button
                                      key={format(week, 'yyyy-MM-dd')}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedWeek(week)}
                                    >
                                      {format(week, 'MMM dd')}
                                    </Button>
                                  ))}
                                  {weeksWithData.length > 3 && (
                                    <span className="text-sm text-muted-foreground">+{weeksWithData.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-2">
                              Upload sales data using the "Upload Data" tab above to get started.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="daily" className="space-y-4">
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
              <EnhancedSalesUploader 
                onUpload={handleSalesDataUpload}
                onDateExtracted={(date) => {
                  // Navigate to the week containing the extracted date
                  setSelectedWeek(date);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailySales;
