import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, 
  Calendar as CalendarIcon, 
  FileText, 
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subWeeks } from 'date-fns';
import { analyticsService, LocationPerformance, ChannelTrendData, ChannelBreakdown } from '@/services/AnalyticsService';
import { exportService } from '@/services/ExportService';
import { salesDataService } from '@/services/SalesDataService';
import { useTeams } from '@/hooks/useTeams';
import { useSalesChannels } from '@/hooks/useSalesChannels';
import { toast } from '@/components/ui/sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { cn } from '@/lib/utils';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'comparative' | 'performance';
type ExportFormat = 'csv' | 'pdf' | 'excel' | 'json';

interface ComparisonData {
  period: string;
  current: number;
  previous: number;
  change: number;
}

const AdvancedReportsManager: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('weekly');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['all']);
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [locationPerformance, setLocationPerformance] = useState<LocationPerformance[]>([]);
  const [channelTrendData, setChannelTrendData] = useState<ChannelTrendData[]>([]);
  const [channelBreakdown, setChannelBreakdown] = useState<ChannelBreakdown | null>(null);

  const { teams } = useTeams();
  const { channels } = useSalesChannels();

  const teamOptions = [
    { id: 'all', name: 'All Teams' },
    ...(teams || [])
  ];

  const reportTypes = [
    { value: 'daily', label: 'Daily Report', icon: CalendarIcon },
    { value: 'weekly', label: 'Weekly Report', icon: BarChart3 },
    { value: 'monthly', label: 'Monthly Report', icon: TrendingUp },
    { value: 'comparative', label: 'Comparative Analysis', icon: Filter },
    { value: 'performance', label: 'Performance Ranking', icon: Clock }
  ];

  useEffect(() => {
    // Set default date ranges based on report type
    const now = new Date();
    switch (selectedReportType) {
      case 'daily':
        setStartDate(now);
        setEndDate(now);
        break;
      case 'weekly':
        setStartDate(startOfWeek(now));
        setEndDate(endOfWeek(now));
        break;
      case 'monthly':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'comparative':
        setStartDate(subMonths(now, 1));
        setEndDate(now);
        break;
      case 'performance':
        setStartDate(subWeeks(now, 4));
        setEndDate(now);
        break;
    }
  }, [selectedReportType]);

  useEffect(() => {
    if (startDate && endDate) {
      generateReport();
    }
  }, [selectedReportType, selectedTeam, startDate, endDate]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const dateRange = { start: startDate, end: endDate };
      
      switch (selectedReportType) {
        case 'daily':
        case 'weekly':
        case 'monthly':
          const [kpiMetrics, trendData, channelTrend, channelBreak] = await Promise.all([
            analyticsService.getKPIMetrics(dateRange, selectedTeam),
            analyticsService.getTrendData(dateRange, selectedTeam),
            analyticsService.getChannelTrendData(dateRange, selectedTeam),
            analyticsService.getChannelBreakdown(dateRange, selectedTeam)
          ]);
          setReportData({ kpiMetrics, trendData });
          setChannelTrendData(channelTrend);
          setChannelBreakdown(channelBreak);
          break;
          
        case 'comparative':
          const comparisonResult = await generateComparisonData(dateRange);
          setComparisonData(comparisonResult);
          break;
          
        case 'performance':
          const performanceData = await analyticsService.getLocationPerformance(dateRange);
          setLocationPerformance(performanceData);
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const generateComparisonData = async (dateRange: { start: Date; end: Date }): Promise<ComparisonData[]> => {
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get current period data
    const currentPeriodData = await analyticsService.getTrendData(dateRange, selectedTeam);
    
    // Get previous period data
    const previousStart = new Date(dateRange.start);
    previousStart.setDate(previousStart.getDate() - daysDiff);
    const previousEnd = new Date(dateRange.end);
    previousEnd.setDate(previousEnd.getDate() - daysDiff);
    
    const previousPeriodData = await analyticsService.getTrendData(
      { start: previousStart, end: previousEnd },
      selectedTeam
    );

    // Group by week for comparison
    const weeklyComparison: ComparisonData[] = [];
    const weeksInPeriod = Math.ceil(daysDiff / 7);
    
    for (let week = 0; week < weeksInPeriod; week++) {
      const weekStart = new Date(dateRange.start);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const currentWeekData = currentPeriodData.filter(d => {
        const date = new Date(d.date);
        return date >= weekStart && date <= weekEnd;
      });
      
      const previousWeekData = previousPeriodData.filter(d => {
        const date = new Date(d.date);
        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - daysDiff);
        const prevWeekEnd = new Date(weekEnd);
        prevWeekEnd.setDate(prevWeekEnd.getDate() - daysDiff);
        return date >= prevWeekStart && date <= prevWeekEnd;
      });
      
      const currentTotal = currentWeekData.reduce((sum, d) => sum + d.grossSales, 0);
      const previousTotal = previousWeekData.reduce((sum, d) => sum + d.grossSales, 0);
      const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
      
      weeklyComparison.push({
        period: `Week ${week + 1}`,
        current: currentTotal,
        previous: previousTotal,
        change
      });
    }
    
    return weeklyComparison;
  };

  const handleQuickDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'today':
        setStartDate(now);
        setEndDate(now);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'this_week':
        setStartDate(startOfWeek(now));
        setEndDate(endOfWeek(now));
        break;
      case 'last_week':
        const lastWeekStart = startOfWeek(subWeeks(now, 1));
        const lastWeekEnd = endOfWeek(subWeeks(now, 1));
        setStartDate(lastWeekStart);
        setEndDate(lastWeekEnd);
        break;
      case 'this_month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'last_month':
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        setStartDate(lastMonthStart);
        setEndDate(lastMonthEnd);
        break;
    }
  };

  const handleExport = async (exportFormat: ExportFormat) => {
    if (!reportData && !comparisonData.length && !locationPerformance.length) {
      toast.error('No data to export');
      return;
    }

    try {
      let blob: Blob;
      let filename: string;
      
      const dateRange = { start: startDate, end: endDate };
      
      switch (selectedReportType) {
        case 'daily':
        case 'weekly':
        case 'monthly':
          if (reportData?.kpiMetrics) {
            blob = await exportService.exportAnalyticsReport(
              reportData.kpiMetrics,
              [],
              {
                format: exportFormat,
                includeInsights: true,
                dateRange,
                teamId: selectedTeam
              }
            );
          } else {
            throw new Error('No analytics data to export');
          }
          break;
          
        default:
          // For other report types, create a simple data export
          const exportData = {
            reportType: selectedReportType,
            dateRange: {
              start: startDate.toISOString(),
              end: endDate.toISOString()
            },
            teamId: selectedTeam,
            data: comparisonData.length > 0 ? comparisonData : locationPerformance
          };
          
          blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          break;
      }
      
      filename = exportService.generateFilename(
        `${selectedReportType}-report`,
        exportFormat,
        dateRange
      );
      
      exportService.downloadBlob(blob, filename);
      toast.success(`${selectedReportType} report exported successfully`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (selectedReportType) {
      case 'daily':
      case 'weekly':
      case 'monthly':
        return renderStandardReport();
      case 'comparative':
        return renderComparativeReport();
      case 'performance':
        return renderPerformanceReport();
      default:
        return <div>Select a report type to view data</div>;
    }
  };

  const renderStandardReport = () => {
    if (!reportData) return <div>No data available</div>;
    
    const { kpiMetrics, trendData } = reportData;

    // Get unique channel names from the trend data
    const channelNames = new Set<string>();
    channelTrendData.forEach(item => {
      Object.keys(item.channels).forEach(name => channelNames.add(name));
    });

    // Define colors for different channels
    const channelColors: Record<string, string> = {
      'UberEats': 'hsl(142, 71%, 45%)',
      'DoorDash': 'hsl(0, 84%, 60%)',
      'Grubhub': 'hsl(25, 95%, 53%)',
      'Postmates': 'hsl(0, 0%, 20%)',
      'Deliveroo': 'hsl(194, 98%, 48%)',
    };
    
    // Filter channel breakdown based on selected channels
    const filteredChannelBreakdown = channelBreakdown && selectedChannels.includes('all')
      ? channelBreakdown
      : channelBreakdown
        ? {
            ...channelBreakdown,
            channels: channelBreakdown.channels.filter(ch => selectedChannels.includes(ch.channelId))
          }
        : null;
    
    return (
      <div className="space-y-6">
        {/* KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Gross Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiMetrics.grossSales)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Net Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiMetrics.netSales)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Orders</p>
                <p className="text-2xl font-bold">{kpiMetrics.orderCount.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Avg Order</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiMetrics.averageOrderValue)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Channel KPI Cards */}
        {filteredChannelBreakdown && filteredChannelBreakdown.channels.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Sales Channel Performance</h3>
              <Badge variant="outline">
                {filteredChannelBreakdown.channels.length} Channel{filteredChannelBreakdown.channels.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredChannelBreakdown.channels.map((channel) => (
                <Card key={channel.channelId} className="border-l-4" style={{ borderLeftColor: channelColors[channel.channelName] || 'hsl(var(--primary))' }}>
                  <CardContent className="p-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">{channel.channelName}</p>
                        <Badge variant="secondary" className="text-xs">
                          {channel.percentageOfTotal.toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold mb-1">{formatCurrency(channel.grossSales)}</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Commission:</span>
                          <span className="text-destructive font-medium">-{formatCurrency(channel.commissionFees)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Net Sales:</span>
                          <span className="text-success font-medium">{formatCurrency(channel.netSales)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Orders:</span>
                          <span>{channel.orderCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate:</span>
                          <span>{(channel.commissionRate * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Channel Totals Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Channel Sales</p>
                    <p className="text-xl font-bold">{formatCurrency(filteredChannelBreakdown.totalGrossSales)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Commission</p>
                    <p className="text-xl font-bold text-destructive">-{formatCurrency(filteredChannelBreakdown.totalCommission)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Net After Commission</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(filteredChannelBreakdown.totalNetSales)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                    <p className="text-xl font-bold">{filteredChannelBreakdown.totalOrders.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Multi-Channel Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={channelTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalSales" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Total Sales"
                  />
                  {Array.from(channelNames).map((channelName, index) => {
                    const shouldShow = selectedChannels.includes('all') || 
                                     filteredChannelBreakdown?.channels.some(ch => ch.channelName === channelName);
                    if (!shouldShow) return null;
                    
                    return (
                      <Line 
                        key={channelName}
                        type="monotone" 
                        dataKey={`channels.${channelName}`}
                        stroke={channelColors[channelName] || `hsl(${(index * 360) / channelNames.size}, 70%, 50%)`}
                        strokeWidth={2}
                        name={channelName}
                        strokeDasharray={index % 2 === 0 ? "0" : "5 5"}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderComparativeReport = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Period Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="current" fill="hsl(var(--primary))" name="Current Period" />
                  <Bar dataKey="previous" fill="hsl(var(--muted))" name="Previous Period" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.period}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.current)} vs {formatCurrency(item.previous)}
                    </p>
                  </div>
                  <Badge variant={item.change >= 0 ? "default" : "destructive"}>
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPerformanceReport = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Performance Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locationPerformance.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {location.ranking}
                  </div>
                  <div>
                    <h4 className="font-medium">{location.location}</h4>
                    <p className="text-sm text-muted-foreground">
                      {location.orderCount} orders • {location.efficiency.toFixed(1)} efficiency
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(location.grossSales)}</p>
                  <p className="text-sm text-muted-foreground">
                    AOV: {formatCurrency(location.averageOrderValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Reports</h2>
          <p className="text-muted-foreground">
            Generate detailed analytics and comparative reports
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={generateReport}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Select defaultValue="pdf" onValueChange={(value: ExportFormat) => handleExport(value)}>
            <SelectTrigger className="w-32">
              <Download className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">Export PDF</SelectItem>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="excel">Export Excel</SelectItem>
              <SelectItem value="json">Export JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedReportType} onValueChange={(value: ReportType) => setSelectedReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Team</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamOptions.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Channel Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sales Channel</label>
              <Select 
                value={selectedChannels.includes('all') ? 'all' : selectedChannels[0] || 'all'} 
                onValueChange={(value) => setSelectedChannels(value === 'all' ? ['all'] : [value])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {(channels || []).filter(ch => ch.is_active).map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Date Range Selector */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('today')}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('yesterday')}>
              Yesterday
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('this_week')}>
              This Week
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('last_week')}>
              Last Week
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('this_month')}>
              This Month
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickDateRange('last_month')}>
              Last Month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div className="min-h-[400px]">
        {renderReportContent()}
      </div>
    </div>
  );
};

export default AdvancedReportsManager;