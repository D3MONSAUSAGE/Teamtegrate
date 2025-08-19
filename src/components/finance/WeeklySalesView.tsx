import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar as CalendarIcon, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp,
  MapPin,
  CalendarDays
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import WeeklySalesTable from './WeeklySalesTable';
import { format, addWeeks, subWeeks, endOfWeek } from 'date-fns';
import { WeeklySalesData } from '@/types/sales';

interface WeeklySalesViewProps {
  weeklyData: WeeklySalesData | null;
  selectedWeek: Date;
  setSelectedWeek: (week: Date) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  locations: string[];
  weeksWithData: Date[];
  totalRecords: number;
  isLoading: boolean;
  onDeleteDay?: (date: string, location: string) => Promise<void>;
}

const WeeklySalesView: React.FC<WeeklySalesViewProps> = ({
  weeklyData,
  selectedWeek,
  setSelectedWeek,
  selectedLocation,
  setSelectedLocation,
  locations,
  weeksWithData,
  totalRecords,
  isLoading,
  onDeleteDay
}) => {
  
  const handleExportWeekly = () => {
    if (!weeklyData) {
      toast.error("No weekly data to export");
      return;
    }
    
    // Create enhanced CSV content
    const headers = [
      'Day', 'Date', 'Location', 'Non Cash', 'Total Cash', 'Gross Total', 'Discount', 
      'Tax Paid', 'Tips', 'Net Sales', 'Calculated Cash', 'Expenses', 'Total In-House Cash'
    ];
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const csvContent = [
      // Header
      headers.join(','),
      // Daily data
      ...days.map(day => {
        const dailySale = weeklyData.dailySales.find(sale => 
          format(new Date(sale.date), 'EEEE') === day
        );
        
        if (!dailySale) {
          return `${day},,${weeklyData.location},0,0,0,0,0,0,0,0,0,0`;
        }
        
        const discount = dailySale.discounts.reduce((sum, d) => sum + d.total, 0);
        const tax = dailySale.taxes.reduce((sum, t) => sum + t.total, 0);
        const expenses = dailySale.expenses || 0;
        const totalInHouseCash = dailySale.paymentBreakdown.calculatedCash - expenses;
        
        return [
          day,
          dailySale.date,
          dailySale.location,
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
      // Separator
      '',
      // Totals row
      [
        'TOTAL',
        `${format(weeklyData.weekStart, 'MMM dd')} - ${format(weeklyData.weekEnd, 'MMM dd')}`,
        weeklyData.location,
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
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weekly-sales-${format(weeklyData.weekStart, 'yyyy-MM-dd')}-${weeklyData.location.replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Weekly report exported successfully!");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading sales data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium">Total Records:</span>
                <Badge variant="secondary">{totalRecords}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="font-medium">Selected Week:</span>
                <span className="text-muted-foreground">
                  {format(selectedWeek, 'MMM dd')} - {format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Weeks with Data:</span>
                <Badge variant="outline">{weeksWithData.length}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Week Navigation */}
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
          
          {/* Quick Week Selection */}
          {weeksWithData.length > 0 && (
            <Select 
              value={format(selectedWeek, 'yyyy-MM-dd')} 
              onValueChange={(value) => setSelectedWeek(new Date(value))}
            >
              <SelectTrigger className="w-60">
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
          
          {/* Location Filter */}
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48">
              <MapPin className="h-4 w-4 mr-2" />
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
        
        {/* Export Button */}
        <Button 
          onClick={handleExportWeekly} 
          variant="outline" 
          disabled={!weeklyData || weeklyData.dailySales.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Weekly Report
        </Button>
      </div>

      {/* Weekly Data Display */}
      {weeklyData && weeklyData.dailySales.length > 0 ? (
        <WeeklySalesTable 
          weeklyData={weeklyData} 
          onDeleteDay={onDeleteDay}
        />
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No Sales Data Found</h3>
                <p className="text-muted-foreground">
                  No sales data found for {format(selectedWeek, 'MMM dd')} - {format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                  {selectedLocation !== 'all' && ` at ${selectedLocation}`}
                </p>
              </div>
              
              {totalRecords > 0 ? (
                <div className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      You have {totalRecords} sales records uploaded. Try selecting a different week or location.
                    </AlertDescription>
                  </Alert>
                  
                  {weeksWithData.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Jump to a week with data:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {weeksWithData.slice(0, 4).map(week => (
                          <Button
                            key={format(week, 'yyyy-MM-dd')}
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWeek(week)}
                          >
                            {format(week, 'MMM dd')}
                          </Button>
                        ))}
                        {weeksWithData.length > 4 && (
                          <Badge variant="secondary">
                            +{weeksWithData.length - 4} more weeks
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <CalendarIcon className="h-4 w-4" />
                  <AlertDescription>
                    No sales data has been uploaded yet. Use the "Upload Data" tab to get started.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WeeklySalesView;