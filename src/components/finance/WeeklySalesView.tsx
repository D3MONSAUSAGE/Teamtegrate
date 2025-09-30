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
  Users,
  CalendarDays,
  Store,
  DollarSign
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import WeeklySalesTable from './WeeklySalesTable';
import { WeekSelectorPopover } from './WeekSelectorPopover';
import { format, addWeeks, subWeeks, endOfWeek } from 'date-fns';
import { WeeklySalesData } from '@/types/sales';
import { formatCurrency } from '@/utils/formatters';

interface WeeklySalesViewProps {
  weeklyData: WeeklySalesData | null;
  selectedWeek: Date;
  setSelectedWeek: (week: Date) => void;
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  teams: Array<{id: string; name: string}>;
  weeksWithData: Date[];
  totalRecords: number;
  isLoading: boolean;
  onDeleteDay?: (date: string, teamId: string) => Promise<void>;
}

const WeeklySalesView: React.FC<WeeklySalesViewProps> = ({
  weeklyData,
  selectedWeek,
  setSelectedWeek,
  selectedTeam,
  setSelectedTeam,
  teams,
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
    
    // Create enhanced CSV content with channel fees
    const headers = [
      'Day', 'Date', 'Location', 'Non Cash', 'Total Cash', 'Gross Total', 'Discount', 
      'Tax Paid', 'Tips', 'Net Sales', 'Calculated Cash', 'Expenses', 'Total In-House Cash'
    ];
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const csvRows = [
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
    ];

    // Add channel fee breakdown if available
    if (weeklyData.channelData && weeklyData.channelData.totalCommission > 0) {
      csvRows.push('');
      csvRows.push('SALES CHANNEL FEES (Deductible Business Expense)');
      csvRows.push('Channel,Gross Sales,Commission Fee,Net Sales,Orders');
      
      Object.entries(weeklyData.channelData.channelBreakdown).forEach(([channel, data]) => {
        csvRows.push([
          channel,
          data.grossSales.toFixed(2),
          data.commission.toFixed(2),
          data.netSales.toFixed(2),
          data.orders
        ].join(','));
      });
      
      csvRows.push('');
      csvRows.push([
        'TOTAL CHANNEL FEES',
        '',
        weeklyData.channelData.totalCommission.toFixed(2),
        '',
        ''
      ].join(','));
      
      csvRows.push('');
      csvRows.push([
        'ADJUSTED NET SALES (After Channel Fees)',
        '',
        '',
        weeklyData.channelData.adjustedNetSales.toFixed(2),
        ''
      ].join(','));
    }
    
    const csvContent = csvRows.join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weekly-sales-${format(weeklyData.weekStart, 'yyyy-MM-dd')}-${weeklyData.location.replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Weekly report with channel fees exported successfully!");
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
                <Users className="h-4 w-4 text-primary" />
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
          
          {/* Week Selection Popover */}
          <WeekSelectorPopover
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />
          
          {/* Team Filter */}
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
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

      {/* Sales Channel Fees Summary */}
      {weeklyData?.channelData && weeklyData.channelData.totalCommission > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Sales Channel Fees Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-accent/50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Net Sales (Before Fees)</div>
                  <div className="text-2xl font-bold">{formatCurrency(weeklyData.totals.netSales)}</div>
                </div>
                <div className="bg-destructive/10 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Total Channel Fees</div>
                  <div className="text-2xl font-bold text-destructive">-{formatCurrency(weeklyData.channelData.totalCommission)}</div>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Adjusted Net Sales</div>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(weeklyData.channelData.adjustedNetSales)}</div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Tax Deductible</div>
                  <div className="text-2xl font-bold">{formatCurrency(weeklyData.channelData.totalCommission)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Channel-by-Channel Breakdown
                </h4>
                <div className="grid gap-3">
                  {Object.entries(weeklyData.channelData.channelBreakdown).map(([channel, data]) => (
                    <div key={channel} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{channel}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.orders} orders • {formatCurrency(data.grossSales)} gross
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-destructive">-{formatCurrency(data.commission)}</div>
                        <div className="text-sm text-muted-foreground">{formatCurrency(data.netSales)} net</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Channel fees are deductible business expenses. This breakdown helps you track delivery service costs for tax purposes.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

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
                  {selectedTeam !== 'all' && ` for ${teams.find(t => t.id === selectedTeam)?.name}`}
                </p>
                {weeksWithData.length > 0 && (
                  <div className="pt-4">
                    <Button 
                      onClick={() => setSelectedWeek(weeksWithData[0])}
                      variant="default"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Jump to Latest Data
                    </Button>
                  </div>
                )}
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