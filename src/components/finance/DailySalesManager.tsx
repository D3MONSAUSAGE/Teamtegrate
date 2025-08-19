import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle, TrendingUp } from "lucide-react";
import { useSalesManager } from '@/hooks/useSalesManager';
import { SalesData } from '@/types/sales';
import SalesUploadManager from './SalesUploadManager';
import WeeklySalesView from './WeeklySalesView';
import WeeklyDetailedReport from './WeeklyDetailedReport';
import { toast } from '@/components/ui/sonner';

const DailySalesManager: React.FC = () => {
  const {
    salesData,
    weeklyData,
    isLoading,
    isUploading,
    selectedWeek,
    setSelectedWeek,
    selectedLocation,
    setSelectedLocation,
    locations,
    weeksWithData,
    totalRecords,
    addSalesData,
    deleteSalesData,
    deleteSalesDataByDate,
    refreshData,
    error
  } = useSalesManager();

  // Parse sales data to the format expected by WeeklyDetailedReport
  const parsedSalesData = salesData.map(item => ({
    ...item,
    date: typeof item.date === 'string' ? new Date(item.date) : item.date
  }));

  const handleSalesDataUpload = async (newData: SalesData) => {
    console.log('[DailySalesManager] Uploading new sales data:', newData);
    try {
      await addSalesData(newData);
      // Success toast is handled in the service
    } catch (error) {
      console.error('[DailySalesManager] Error uploading sales data:', error);
      // Error handling is done in the hook and service
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshData();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('[DailySalesManager] Error refreshing data:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Daily Sales Management</h2>
          <p className="text-muted-foreground">
            Upload, analyze, and track your daily sales data with intelligent weekly reporting
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isLoading}
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly">Weekly View</TabsTrigger>
              <TabsTrigger value="report">Weekly Report</TabsTrigger>
              <TabsTrigger value="upload">Upload Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="weekly" className="mt-6">
              <WeeklySalesView
                weeklyData={weeklyData}
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                locations={locations}
                weeksWithData={weeksWithData}
                totalRecords={totalRecords}
                isLoading={isLoading}
                onDeleteDay={deleteSalesDataByDate}
              />
            </TabsContent>
            
            <TabsContent value="report" className="mt-6">
              <WeeklyDetailedReport
                weeklyData={weeklyData}
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                locations={locations}
                weeksWithData={weeksWithData}
                salesData={parsedSalesData}
                isLoading={isLoading}
              />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-6">
              <SalesUploadManager 
                onUpload={handleSalesDataUpload}
                onDateExtracted={(date) => {
                  // Navigate to the week containing the extracted date
                  setSelectedWeek(date);
                }}
                isUploading={isUploading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailySalesManager;