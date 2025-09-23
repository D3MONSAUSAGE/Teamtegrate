import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Target,
  Users,
  FolderOpen,
  BarChart3
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  color = 'primary'
}) => {
  const colorConfig = {
    primary: {
      bg: 'from-primary/10 to-primary/5',
      icon: 'text-primary',
      value: 'text-foreground'
    },
    success: {
      bg: 'from-green-500/10 to-green-500/5',
      icon: 'text-green-600',
      value: 'text-green-700'
    },
    warning: {
      bg: 'from-yellow-500/10 to-yellow-500/5',
      icon: 'text-yellow-600',
      value: 'text-yellow-700'
    },
    danger: {
      bg: 'from-red-500/10 to-red-500/5',
      icon: 'text-red-600',
      value: 'text-red-700'
    }
  };

  const config = colorConfig[color];
  
  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up': return 'text-green-600 bg-green-50 border-green-200';
      case 'down': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${config.value}`}>
                {value}
              </p>
              {trend && (
                <Badge variant="outline" className={`text-xs ${getTrendColor()}`}>
                  {trend}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br ${config.bg}`}>
            <Icon className={`h-6 w-6 ${config.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ReportMetricsGridProps {
  metrics: {
    completedTasks: number;
    totalTasks: number;
    completionRate: number;
    totalHours: number;
    activeProjects: number;
    teamMembers: number;
    overdueCount?: number;
    avgTaskTime?: number;
  };
  timeframe?: string;
}

export const ReportMetricsGrid: React.FC<ReportMetricsGridProps> = ({
  metrics,
  timeframe = 'this period'
}) => {
  const completionTrend: 'up' | 'down' | 'neutral' = metrics.completionRate >= 90 ? 'up' : 
                         metrics.completionRate >= 70 ? 'neutral' : 'down';

  const getCompletionColor = (completionRate: number): 'success' | 'warning' | 'danger' => {
    if (completionRate >= 90) return 'success';
    if (completionRate >= 70) return 'warning';
    return 'danger';
  };

  const metricsConfig: Array<{
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ComponentType<any>;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    color?: 'primary' | 'success' | 'warning' | 'danger';
  }> = [
    {
      title: 'Task Completion',
      value: `${metrics.completedTasks}/${metrics.totalTasks}`,
      subtitle: `${metrics.completionRate}% completion rate`,
      icon: CheckCircle,
      trend: `${metrics.completionRate}%`,
      trendDirection: completionTrend,
      color: getCompletionColor(metrics.completionRate)
    },
    {
      title: 'Hours Worked',
      value: `${metrics.totalHours}h`,
      subtitle: `Total time ${timeframe}`,
      icon: Clock,
      trend: metrics.avgTaskTime ? `${metrics.avgTaskTime}h avg` : undefined,
      trendDirection: 'neutral',
      color: 'primary'
    },
    {
      title: 'Active Projects',
      value: metrics.activeProjects,
      subtitle: `Projects in progress`,
      icon: FolderOpen,
      color: 'primary'
    },
    {
      title: 'Team Size',
      value: metrics.teamMembers,
      subtitle: `Active team members`,
      icon: Users,
      color: 'primary'
    },
    {
      title: 'Performance Score',
      value: `${metrics.completionRate}%`,
      subtitle: `Overall performance`,
      icon: BarChart3,
      trend: completionTrend === 'up' ? '+5%' : 
             completionTrend === 'down' ? '-3%' : '±0%',
      trendDirection: completionTrend,
      color: 'primary'
    }
  ];

  // Add overdue metric if available
  if (metrics.overdueCount !== undefined) {
    metricsConfig.push({
      title: 'Overdue Tasks',
      value: metrics.overdueCount,
      subtitle: `Tasks past due date`,
      icon: AlertTriangle,
      color: metrics.overdueCount > 0 ? 'danger' : 'success',
      trend: metrics.overdueCount > 0 ? 'Action needed' : 'All good',
      trendDirection: metrics.overdueCount > 0 ? 'down' : 'up'
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Key Metrics
        </h3>
        <Badge variant="outline" className="text-xs">
          {timeframe}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metricsConfig.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            trend={metric.trend}
            trendDirection={metric.trendDirection}
            color={metric.color}
          />
        ))}
      </div>
    </div>
  );
};