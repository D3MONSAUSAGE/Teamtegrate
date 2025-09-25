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
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface DailyInventoryMetricsProps {
  summary: {
    totalValueCounted: number;
    itemsProcessed: number;
    varianceCost: number;
    accuracyRatePct: number;
    avgCompletionHours: number;
    completedCounts: number;
    activeTeams: number;
    performanceGrade: string;
  };
  timezone?: string;
}

export const DailyInventoryMetrics: React.FC<DailyInventoryMetricsProps> = ({
  summary
}) => {
  // Pure component - all data comes from summary prop

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Daily Inventory Summary</h3>
          <p className="text-sm text-muted-foreground">
            Performance overview for selected date and filters
          </p>
        </div>
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
              {formatCurrency(summary.totalValueCounted)}
            </div>
            <div className="text-sm text-muted-foreground">
              {summary.itemsProcessed} items counted
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
              {summary.itemsProcessed.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {summary.completedCounts} counts completed
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
              {formatCurrency(summary.varianceCost)}
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
              {formatPercentage(summary.accuracyRatePct * 100)}
            </div>
            <div className={cn(
              "text-sm",
              summary.accuracyRatePct >= 0.95 ? "text-success" : 
              summary.accuracyRatePct >= 0.85 ? "text-warning" : "text-destructive"
            )}>
              {summary.accuracyRatePct >= 0.95 ? 'Excellent' : 
               summary.accuracyRatePct >= 0.85 ? 'Good' : 'Needs Improvement'}
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
              {summary.avgCompletionHours.toFixed(1)}h
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
              {summary.completedCounts}
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
              {summary.activeTeams}
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
                summary.accuracyRatePct >= 0.95 ? "text-success" : 
                summary.accuracyRatePct >= 0.85 ? "text-warning" : "text-destructive"
              )}>
                {summary.performanceGrade}
              </div>
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