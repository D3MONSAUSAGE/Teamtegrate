import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface OverviewMetricsProps {
  overview: {
    totalInstances: number;
    activeInstances: number;
    completedInstances: number;
    averageCompletionDays: number;
    completionRate: number;
  };
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ overview }) => {
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionRateIcon = (rate: number) => {
    if (rate >= 70) return <TrendingUp className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Instances</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.totalInstances}</div>
          <p className="text-xs text-muted-foreground">All onboarding processes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{overview.activeInstances}</div>
          <p className="text-xs text-muted-foreground">Currently onboarding</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{overview.completedInstances}</div>
          <p className="text-xs text-muted-foreground">Successfully finished</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.averageCompletionDays}d</div>
          <p className="text-xs text-muted-foreground">Days to complete</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <div className={getCompletionRateColor(overview.completionRate)}>
            {getCompletionRateIcon(overview.completionRate)}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getCompletionRateColor(overview.completionRate)}`}>
            {overview.completionRate}%
          </div>
          <p className="text-xs text-muted-foreground">Completion rate</p>
        </CardContent>
      </Card>
    </div>
  );
};