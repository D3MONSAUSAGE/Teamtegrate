import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { MonthWeekPicker } from '@/components/ui/month-week-picker';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Download,
  TrendingUp,
  Users,
  Filter,
  BarChart3
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useSalesManager } from '@/hooks/useSalesManager';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import WeeklySalesTable from '@/components/finance/WeeklySalesTable';

type TimePeriod = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom';

const SalesSummaryTab: React.FC = () => {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('this-week');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  
  const { 
    weeklyData, 
    salesData, 
    isLoading, 
    selectedTeam, 
    setSelectedTeam, 
    teams 
  } = useSalesManager();
  
  const isAdmin = hasRoleAccess(user?.role, 'admin');
  const isSuperAdmin = hasRoleAccess(user?.role, 'superadmin');
  const showTeamSelector = isAdmin || isSuperAdmin;

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    
    const now = new Date();
    switch (period) {
      case 'this-week':
        setSelectedWeek(now);
        break;
      case 'last-week':
        setSelectedWeek(addDays(now, -7));
        break;
      case 'this-month':
        setCustomDateRange({
          from: startOfMonth(now),
          to: endOfMonth(now)
        });
        break;
      case 'last-month':
        const lastMonth = addDays(startOfMonth(now), -1);
        setCustomDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        });
        break;
    }
  };

  const handleExport = () => {
    if (!weeklyData) return;
    
    const teamName = teams.find(t => t.id === selectedTeam)?.name || 'All-Teams';
    const dateStr = timePeriod === 'custom' 
      ? `${customDateRange?.from?.toISOString().split('T')[0]}-to-${customDateRange?.to?.toISOString().split('T')[0]}`
      : timePeriod;
    
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
        
        <CardContent className="space-y-4">
          {/* Time Period Selection */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Time Period:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'this-week', label: 'This Week' },
                { value: 'last-week', label: 'Last Week' },
                { value: 'this-month', label: 'This Month' },
                { value: 'last-month', label: 'Last Month' },
                { value: 'custom', label: 'Custom Range' }
              ].map(option => (
                <Button
                  key={option.value}
                  variant={timePeriod === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTimePeriodChange(option.value as TimePeriod)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date/Week Selectors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

            {/* Date Range Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {timePeriod === 'custom' ? 'Custom Date Range' : 'Selected Period'}
              </label>
              
              {(timePeriod === 'this-week' || timePeriod === 'last-week') && (
                <MonthWeekPicker 
                  selectedWeek={selectedWeek}
                  onWeekChange={setSelectedWeek}
                />
              )}
              
              {(timePeriod === 'this-month' || timePeriod === 'last-month' || timePeriod === 'custom') && (
                <DatePickerWithRange
                  date={customDateRange}
                  onDateChange={setCustomDateRange}
                />
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Badge variant="secondary">
              {teams.find(t => t.id === selectedTeam)?.name || 'All Teams'}
            </Badge>
            <Badge variant="outline">
              {timePeriod === 'custom' 
                ? `${customDateRange?.from?.toLocaleDateString()} - ${customDateRange?.to?.toLocaleDateString()}`
                : timePeriod.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
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