import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeekPicker } from '@/components/ui/week-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWeeklySalesSummaryData } from '@/hooks/useWeeklySalesSummaryData';
import { formatCurrency } from '@/utils/formatters';
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Calendar,
  Star,
  BarChart3,
  Brain,
  FileText
} from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface WeeklySalesViewProps {
  onBackToDashboard: () => void;
}

const WeeklySalesView: React.FC<WeeklySalesViewProps> = ({ onBackToDashboard }) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>('all');
  const [activeTab, setActiveTab] = useState('overview');

  const calculatedDateRange = {
    from: startOfWeek(selectedWeek, { weekStartsOn: 1 }),
    to: endOfWeek(selectedWeek, { weekStartsOn: 1 }),
    label: `Week of ${format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
  };

  const { summaryData, isLoading, error } = useWeeklySalesSummaryData({
    dateRange: calculatedDateRange,
    teamId: selectedTeamId
  });

  const handleExport = () => {
    const csvData = summaryData?.dailyBreakdown?.map(day => ({
      Date: format(day.date, 'yyyy-MM-dd'),
      Day: format(day.date, 'EEEE'),
      Sales: day.sales,
      Transactions: day.transactions,
      AvgTransaction: day.transactions > 0 ? (day.sales / day.transactions).toFixed(2) : '0.00'
    }));

    const csvContent = [
      ['Date', 'Day', 'Sales', 'Transactions', 'Avg Transaction'],
      ...(csvData?.map(row => Object.values(row)) || [])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-sales-summary-${format(selectedWeek, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Weekly Sales Summary</h1>
              <Badge variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                <Star className="h-3 w-3 mr-1" />
                Popular
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Comprehensive weekly performance analysis for your business
            </p>
          </div>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Week Navigation & Team Selection */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <WeekPicker 
              selectedWeek={selectedWeek}
              onWeekChange={setSelectedWeek}
            />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Team:</span>
              <Select value={selectedTeamId || 'all'} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly-view">Weekly View</TabsTrigger>
          <TabsTrigger value="detailed-report">Detailed Report</TabsTrigger>
          <TabsTrigger value="advanced-reports">Advanced Reports</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">{formatCurrency(summaryData?.totalSales || 0)}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {(summaryData?.salesGrowth || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={`${(summaryData?.salesGrowth || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {Math.abs(summaryData?.salesGrowth || 0).toFixed(1)}% vs last week
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold">{summaryData?.totalTransactions || 0}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {(summaryData?.transactionGrowth || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={`${(summaryData?.transactionGrowth || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {Math.abs(summaryData?.transactionGrowth || 0).toFixed(1)}% vs last week
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Avg Transaction</p>
                    <p className="text-2xl font-bold">{formatCurrency(summaryData?.averageTransaction || 0)}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {(summaryData?.avgTransactionGrowth || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={`${(summaryData?.avgTransactionGrowth || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {Math.abs(summaryData?.avgTransactionGrowth || 0).toFixed(1)}% vs last week
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Days Active</p>
                    <p className="text-2xl font-bold">{summaryData?.daysWithSales || 0}</p>
                    <p className="text-sm text-muted-foreground">out of 7 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Breakdown */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summaryData?.dailyBreakdown?.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-16 text-sm font-medium">
                        {format(day.date, 'EEE')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(day.date, 'MMM d')}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(day.sales)}</p>
                        <p className="text-sm text-muted-foreground">{day.transactions} orders</p>
                      </div>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(100, (day.sales / (summaryData?.maxDailySales || 1)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs content placeholders */}
        <TabsContent value="weekly-view">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Weekly comparison and trends view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed-report">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detailed Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Comprehensive detailed report view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced-reports">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced analytics and custom reports coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">AI-powered insights and recommendations coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WeeklySalesView;
