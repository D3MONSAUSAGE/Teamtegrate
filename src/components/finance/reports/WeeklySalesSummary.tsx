import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReportFilters } from '@/components/finance/reports/ReportFilters';
import { useReportFilters } from '@/hooks/useReportFilters';
import { useWeeklySalesSummaryData } from '@/hooks/useWeeklySalesSummaryData';
import { formatCurrency } from '@/utils/formatters';
import { Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export const WeeklySalesSummary: React.FC = () => {
  const {
    timeRange,
    dateRange,
    selectedTeamId,
    calculatedDateRange,
    setTimeRange,
    setDateRange,
    setSelectedTeamId
  } = useReportFilters();

  const { summaryData, isLoading, error } = useWeeklySalesSummaryData({
    dateRange: calculatedDateRange,
    teamId: selectedTeamId
  });

  const handleExport = () => {
    // Export functionality will be implemented
    console.log('Exporting weekly summary...');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Weekly Sales Summary</h1>
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

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Weekly Sales Summary</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error loading sales data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weekStart = startOfWeek(calculatedDateRange.from, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(calculatedDateRange.from, { weekStartsOn: 1 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weekly Sales Summary</h1>
          <p className="text-muted-foreground">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <ReportFilters
        timeRange={timeRange}
        dateRange={dateRange}
        selectedTeamId={selectedTeamId}
        onTimeRangeChange={setTimeRange}
        onDateRangeChange={setDateRange}
        onTeamChange={setSelectedTeamId}
        calculatedDateRange={calculatedDateRange}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summaryData?.dailyBreakdown?.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-12 text-sm font-medium">
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
                      className="h-full bg-primary rounded-full transition-all"
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

      {/* Team Performance (if multiple teams) */}
      {summaryData?.teamBreakdown && summaryData.teamBreakdown.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summaryData.teamBreakdown.map((team, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{team.teamName}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(team.sales)}</p>
                      <p className="text-sm text-muted-foreground">{team.transactions} orders</p>
                    </div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(100, (team.sales / (summaryData?.totalSales || 1)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};