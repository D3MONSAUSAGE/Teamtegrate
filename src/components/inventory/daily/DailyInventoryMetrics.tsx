import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { DailyAnalyticsMetrics } from '@/hooks/useDailyInventoryAnalytics';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface DailyInventoryMetricsProps {
  metrics: DailyAnalyticsMetrics;
  selectedDate: Date;
}

export const DailyInventoryMetrics: React.FC<DailyInventoryMetricsProps> = ({
  metrics,
  selectedDate
}) => {
  const getTrendIcon = () => {
    if (metrics.trendDirection === 'up') return <ArrowUpRight className="h-4 w-4 text-success" />;
    if (metrics.trendDirection === 'down') return <ArrowDownRight className="h-4 w-4 text-destructive" />;
    return null;
  };

  const isToday = new Date().toDateString() === selectedDate.toDateString();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Daily Inventory Summary</h3>
          <p className="text-sm text-muted-foreground">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
            {isToday && <Badge variant="secondary" className="ml-2">Today</Badge>}
          </p>
        </div>
        {metrics.trendDirection !== 'stable' && (
          <div className="flex items-center gap-2 text-sm">
            {getTrendIcon()}
            <span className={cn(
              metrics.trendDirection === 'up' ? 'text-success' : 'text-destructive'
            )}>
              {metrics.trendDirection === 'up' ? 'Trending up' : 'Trending down'}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Value Counted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(metrics.totalValue)}
            </div>
            <div className="text-sm text-muted-foreground">
              {metrics.totalItemsCounted} items counted
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalItemsCounted.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {metrics.completedCounts} counts completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Variance Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(metrics.totalVarianceCost)}
            </div>
            <div className="text-sm text-muted-foreground">
              Daily discrepancies
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Accuracy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(metrics.accuracyRate)}
            </div>
            <div className={cn(
              "text-sm",
              metrics.accuracyRate >= 95 ? "text-success" : 
              metrics.accuracyRate >= 85 ? "text-warning" : "text-destructive"
            )}>
              {metrics.accuracyRate >= 95 ? 'Excellent' : 
               metrics.accuracyRate >= 85 ? 'Good' : 'Needs Improvement'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Completion Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageCompletionTime.toFixed(1)}h
            </div>
            <div className="text-sm text-muted-foreground">
              Per count session
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Counts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {metrics.completedCounts}
            </div>
            <div className="text-sm text-muted-foreground">
              Count sessions finished
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {metrics.activeTeams}
            </div>
            <div className="text-sm text-muted-foreground">
              Teams participated
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={cn(
                "text-2xl font-bold",
                metrics.accuracyRate >= 95 ? "text-success" : 
                metrics.accuracyRate >= 85 ? "text-warning" : "text-destructive"
              )}>
                {metrics.accuracyRate >= 95 ? 'A+' : 
                 metrics.accuracyRate >= 85 ? 'B' : 'C'}
              </div>
              {getTrendIcon()}
            </div>
            <div className="text-sm text-muted-foreground">
              Daily grade
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};