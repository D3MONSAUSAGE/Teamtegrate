import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Calendar,
  FileText,
  Eye
} from 'lucide-react';
import { analyticsService, KPIMetrics, PerformanceInsight } from '@/services/AnalyticsService';
import { exportService } from '@/services/ExportService';
import { useTeams } from '@/hooks/useTeams';
import { toast } from '@/components/ui/sonner';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import WeeklySalesView from '../WeeklySalesView';
import WeeklyDetailedReport from '../WeeklyDetailedReport';
import AdvancedReportsManager from './AdvancedReportsManager';
import { useSalesManager } from '@/hooks/useSalesManager';

interface AdvancedAnalyticsDashboardProps {
  onBackToDashboard: () => void;
}

interface DateRangeOption {
  label: string;
  value: string;
  start: Date;
  end: Date;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ onBackToDashboard }) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics | null>(null);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  
  // Sales manager for weekly data
  const {
    salesData,
    weeklyData,
    selectedWeek,
    setSelectedWeek,
    weeksWithData,
    selectedTeam: salesSelectedTeam,
    setSelectedTeam: setSalesSelectedTeam,
    teams: salesTeams,
    deleteSalesDataByDate,
    totalRecords,
    isLoading: salesIsLoading
  } = useSalesManager();
  
  const { teams } = useTeams();
  
  const dateRangeOptions: DateRangeOption[] = [
    {
      label: 'Last 7 Days',
      value: '7d',
      start: subDays(new Date(), 7),
      end: new Date()
    },
    {
      label: 'Last 30 Days',
      value: '30d',
      start: subDays(new Date(), 30),
      end: new Date()
    },
    {
      label: 'This Month',
      value: 'month',
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    },
    {
      label: 'Last Month',
      value: 'last_month',
      start: startOfMonth(subMonths(new Date(), 1)),
      end: endOfMonth(subMonths(new Date(), 1))
    }
  ];

  const currentDateRange = dateRangeOptions.find(option => option.value === selectedDateRange) || dateRangeOptions[0];
  
  const teamOptions = [
    { id: 'all', name: 'All Teams' },
    ...(teams || [])
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTeam, selectedDateRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const dateRange = { start: currentDateRange.start, end: currentDateRange.end };
      
      // Load KPI metrics and insights in parallel
      const [kpiData, insightsData, trendsData] = await Promise.all([
        analyticsService.getKPIMetrics(dateRange, selectedTeam),
        analyticsService.getPerformanceInsights(dateRange, selectedTeam),
        analyticsService.getTrendData(dateRange, selectedTeam)
      ]);
      
      setKpiMetrics(kpiData);
      setInsights(insightsData);
      setTrendData(trendsData);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalyticsData();
    setIsRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const handleExportReport = async () => {
    if (!kpiMetrics) return;
    
    try {
      const blob = await exportService.exportAnalyticsReport(kpiMetrics, insights, {
        format: 'pdf',
        includeInsights: true,
        dateRange: { start: currentDateRange.start, end: currentDateRange.end },
        teamId: selectedTeam
      });
      
      const filename = exportService.generateFilename('analytics-report', 'pdf', {
        start: currentDateRange.start,
        end: currentDateRange.end
      });
      
      exportService.downloadBlob(blob, filename);
      toast.success('Analytics report exported successfully');
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

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getInsightIcon = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'achievement':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInsightColor = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'achievement':
        return 'border-green-200 bg-green-50';
      case 'alert':
        return 'border-yellow-200 bg-yellow-50';
      case 'opportunity':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-muted bg-background';
    }
  };

  // Parse sales data for weekly detailed report
  const parsedSalesData = salesData.map(item => ({
    ...item,
    date: typeof item.date === 'string' ? new Date(item.date) : item.date
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={onBackToDashboard}
            className="mb-4 -ml-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business intelligence and reporting</p>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="weekly">Weekly View</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Reports</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Analytics Overview</h2>
                    <p className="text-muted-foreground">
                      Real-time insights and performance metrics for {currentDateRange.label.toLowerCase()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateRangeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="w-40">
                        <Users className="h-4 w-4 mr-2" />
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
                    
                    <Button
                      onClick={handleRefresh}
                      variant="outline"
                      size="sm"
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    
                    <Button
                      onClick={handleExportReport}
                      variant="outline"
                      size="sm"
                      disabled={!kpiMetrics}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* KPI Cards */}
                {kpiMetrics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-700">Gross Sales</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {formatCurrency(kpiMetrics.grossSales)}
                            </p>
                            <div className="flex items-center mt-2">
                              {kpiMetrics.periodComparison.grossSalesChange >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                              )}
                              <span className={`text-sm font-medium ${getChangeColor(kpiMetrics.periodComparison.grossSalesChange)}`}>
                                {formatPercentage(kpiMetrics.periodComparison.grossSalesChange)}
                              </span>
                            </div>
                          </div>
                          <DollarSign className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-700">Net Sales</p>
                            <p className="text-2xl font-bold text-green-900">
                              {formatCurrency(kpiMetrics.netSales)}
                            </p>
                            <div className="flex items-center mt-2">
                              {kpiMetrics.periodComparison.netSalesChange >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                              )}
                              <span className={`text-sm font-medium ${getChangeColor(kpiMetrics.periodComparison.netSalesChange)}`}>
                                {formatPercentage(kpiMetrics.periodComparison.netSalesChange)}
                              </span>
                            </div>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-700">Order Count</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {kpiMetrics.orderCount.toLocaleString()}
                            </p>
                            <div className="flex items-center mt-2">
                              {kpiMetrics.periodComparison.orderCountChange >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                              )}
                              <span className={`text-sm font-medium ${getChangeColor(kpiMetrics.periodComparison.orderCountChange)}`}>
                                {formatPercentage(kpiMetrics.periodComparison.orderCountChange)}
                              </span>
                            </div>
                          </div>
                          <ShoppingCart className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-700">Avg Order Value</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {formatCurrency(kpiMetrics.averageOrderValue)}
                            </p>
                            <div className="flex items-center mt-2">
                              {kpiMetrics.periodComparison.averageOrderValueChange >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                              )}
                              <span className={`text-sm font-medium ${getChangeColor(kpiMetrics.periodComparison.averageOrderValueChange)}`}>
                                {formatPercentage(kpiMetrics.periodComparison.averageOrderValueChange)}
                              </span>
                            </div>
                          </div>
                          <BarChart3 className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Charts and Insights Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sales Trend Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Sales Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                              className="text-xs"
                            />
                            <YAxis 
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                              className="text-xs"
                            />
                            <Tooltip 
                              formatter={(value: number) => [formatCurrency(value), 'Sales']}
                              labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="grossSales" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={3}
                              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Performance Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {insights.length > 0 ? (
                          insights.map((insight) => (
                            <div
                              key={insight.id}
                              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                            >
                              <div className="flex items-start gap-3">
                                {getInsightIcon(insight.type)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold">{insight.title}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {insight.impact}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {insight.description}
                                  </p>
                                  {insight.actionable && (
                                    <Badge variant="secondary" className="mt-2 text-xs">
                                      Actionable
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              No performance issues detected. Everything looks good!
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-6">
              <WeeklySalesView
                weeklyData={weeklyData}
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
                selectedTeam={salesSelectedTeam}
                setSelectedTeam={setSalesSelectedTeam}
                teams={salesTeams}
                weeksWithData={weeksWithData}
                totalRecords={totalRecords}
                isLoading={salesIsLoading}
                onDeleteDay={deleteSalesDataByDate}
              />
            </TabsContent>
            
            <TabsContent value="detailed" className="mt-6">
              <WeeklyDetailedReport
                weeklyData={weeklyData}
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
                selectedTeam={salesSelectedTeam}
                setSelectedTeam={setSalesSelectedTeam}
                teams={salesTeams}
                weeksWithData={weeksWithData}
                salesData={parsedSalesData}
                isLoading={salesIsLoading}
              />
            </TabsContent>
            
            <TabsContent value="advanced" className="mt-6">
              <AdvancedReportsManager />
            </TabsContent>
            
            <TabsContent value="insights" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    AI-Powered Business Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">AI Insights Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Advanced AI-powered business insights and recommendations will be available soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;