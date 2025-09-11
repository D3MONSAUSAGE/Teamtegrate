import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { CalendarWeekPicker } from '@/components/ui/calendar-week-picker';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Download,
  TrendingUp,
  Users,
  Filter,
  BarChart3
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useSalesManager } from '@/hooks/useSalesManager';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import WeeklySalesTable from '@/components/finance/WeeklySalesTable';

type ReportType = 'weekly' | 'custom';

const SalesSummaryTab: React.FC = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  
  const { 
    weeklyData, 
    salesData, 
    isLoading, 
    selectedTeam, 
    setSelectedTeam, 
    teams,
    setSelectedWeek: updateSelectedWeek
  } = useSalesManager();
  
  const isAdmin = hasRoleAccess(user?.role, 'admin');
  const isSuperAdmin = hasRoleAccess(user?.role, 'superadmin');
  const showTeamSelector = isAdmin || isSuperAdmin;

  const handleWeekChange = (week: Date) => {
    setSelectedWeek(week);
    updateSelectedWeek(week);
  };

  const handleExport = () => {
    if (!weeklyData) return;
    
    const teamName = teams.find(t => t.id === selectedTeam)?.name || 'All-Teams';
    const dateStr = reportType === 'custom' 
      ? `${customDateRange?.from?.toISOString().split('T')[0]}-to-${customDateRange?.to?.toISOString().split('T')[0]}`
      : `Week-${format(selectedWeek, 'yyyy-MM-dd')}`;
    
    const filename = `Sales-Report_${teamName}_${dateStr}_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Prepare CSV data
    const headers = ['Date', 'Gross Sales', 'Net Sales', 'Orders', 'Avg Order', 'Labor %', 'Cash', 'Non-Cash'];
    const rows = weeklyData.dailySales.map(day => [
      day.date,
      day.grossSales.toFixed(2),
      day.netSales.toFixed(2),
      day.orderCount.toString(),
      day.orderAverage.toFixed(2),
      day.labor.percentage.toFixed(1),
      day.paymentBreakdown.totalCash.toFixed(2),
      day.paymentBreakdown.nonCash.toFixed(2)
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <Card className="glass-card border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Sales Summary & Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Advanced filtering and detailed sales analysis
              </p>
            </div>
            <Button onClick={handleExport} className="lg:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Report Type Toggle */}
          <Tabs value={reportType} onValueChange={(value) => setReportType(value as ReportType)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
              <TabsTrigger value="custom">Custom Date Range</TabsTrigger>
            </TabsList>
            
            <TabsContent value="weekly" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Selector */}
                {showTeamSelector && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team Selection
                    </label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {team.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Week Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Select Week
                  </label>
                  <CalendarWeekPicker 
                    selectedWeek={selectedWeek}
                    onWeekChange={handleWeekChange}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Selector */}
                {showTeamSelector && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team Selection
                    </label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {team.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Custom Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Custom Date Range
                  </label>
                  <DatePickerWithRange
                    date={customDateRange}
                    onDateChange={setCustomDateRange}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Badge variant="secondary">
              {teams.find(t => t.id === selectedTeam)?.name || 'All Teams'}
            </Badge>
            <Badge variant="outline">
              {reportType === 'custom' && customDateRange?.from && customDateRange?.to
                ? `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d, yyyy')}`
                : `Week of ${format(selectedWeek, 'MMM d, yyyy')}`
              }
            </Badge>
            {salesData && (
              <Badge variant="outline">
                {salesData.length} records
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Detailed Sales Table */}
      {weeklyData && (
        <Card className="glass-card border-0 shadow-md">
          <CardHeader>
            <CardTitle>Detailed Sales Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklySalesTable weeklyData={weeklyData} />
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {weeklyData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-0 shadow-md">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${weeklyData.totals.grossTotal.toLocaleString()}</p>
                <p className="text-xs text-emerald-600">+12.5% vs previous period</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-0 shadow-md">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Average Daily Sales</p>
                <p className="text-2xl font-bold">
                  ${weeklyData.dailySales.length > 0 
                    ? (weeklyData.totals.grossTotal / weeklyData.dailySales.length).toLocaleString(undefined, {maximumFractionDigits: 0})
                    : '0'
                  }
                </p>
                <p className="text-xs text-blue-600">Based on {weeklyData.dailySales.length} days</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-0 shadow-md">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold">
                  {weeklyData.totals.grossTotal > 0 
                    ? ((weeklyData.totals.netSales / weeklyData.totals.grossTotal) * 100).toFixed(1)
                    : '0'
                  }%
                </p>
                <p className="text-xs text-purple-600">After discounts & taxes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SalesSummaryTab;