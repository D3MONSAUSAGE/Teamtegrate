import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Zap,
  Award,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'accent';
  progress?: number;
  animationDelay?: number;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color,
  progress,
  animationDelay = 0
}) => {
  const colorClasses = {
    primary: 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10',
    success: 'border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10',
    warning: 'border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10',
    accent: 'border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10'
  };

  const iconColorClasses = {
    primary: 'text-primary',
    success: 'text-accent',
    warning: 'text-warning',
    accent: 'text-accent'
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-accent" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card 
      className={cn(
        "group hover:shadow-lg transition-all duration-300 animate-bounce-in border-2",
        colorClasses[color]
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-xl", iconColorClasses[color])}>
            <div className="h-6 w-6">{icon}</div>
          </div>
          {trend && trendValue && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={cn(
                "text-sm font-medium",
                trend === 'up' ? 'text-accent' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="flex items-end space-x-2">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {subtitle && (
              <span className="text-sm text-muted-foreground pb-1">{subtitle}</span>
            )}
          </div>
        </div>

        {progress !== undefined && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-2 animate-progress-draw"
              style={{ animationDelay: `${animationDelay + 200}ms` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ExecutiveSummaryProps {
  taskStats?: {
    completed_tasks: number;
    total_tasks: number;
    completion_rate: number;
  };
  hoursStats?: {
    total_hours: number;
    avg_daily_hours: number;
    overtime_hours: number;
  };
  contributions?: Array<{
    project_title: string;
    task_count: number;
    completion_rate: number;
  }>;
  isLoading?: boolean;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  taskStats,
  hoursStats,
  contributions,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-shimmer">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-12 w-12 bg-muted rounded-xl animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-8 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate productivity score based on completion rate and hours
  const productivityScore = Math.round(
    ((taskStats?.completion_rate || 0) * 0.6) + 
    (Math.min((hoursStats?.total_hours || 0) / 40, 1) * 40)
  );

  // Calculate trend values (mock data for demo)
  const taskTrend = taskStats?.completion_rate > 75 ? 'up' : taskStats?.completion_rate < 50 ? 'down' : 'neutral';
  const hoursTrend = (hoursStats?.total_hours || 0) > 35 ? 'up' : 'neutral';
  const projectsCount = contributions?.length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Task Completion Rate"
        value={`${Math.round(taskStats?.completion_rate || 0)}%`}
        subtitle={`${taskStats?.completed_tasks || 0} of ${taskStats?.total_tasks || 0} tasks`}
        icon={<CheckCircle2 />}
        color="success"
        trend={taskTrend}
        trendValue={taskTrend === 'up' ? '+12%' : taskTrend === 'down' ? '-5%' : '0%'}
        progress={taskStats?.completion_rate || 0}
        animationDelay={0}
      />
      
      <KPICard
        title="Hours Worked"
        value={Math.round(hoursStats?.total_hours || 0)}
        subtitle={`${(hoursStats?.avg_daily_hours || 0).toFixed(1)}h daily avg`}
        icon={<Clock />}
        color="primary"
        trend={hoursTrend}
        trendValue={hoursTrend === 'up' ? '+3h' : '0h'}
        progress={Math.min(((hoursStats?.total_hours || 0) / 40) * 100, 100)}
        animationDelay={100}
      />
      
      <KPICard
        title="Productivity Score"
        value={productivityScore}
        subtitle="AI-calculated"
        icon={<Zap />}
        color="warning"
        trend={productivityScore > 80 ? 'up' : productivityScore < 60 ? 'down' : 'neutral'}
        trendValue={productivityScore > 80 ? '+15pts' : productivityScore < 60 ? '-8pts' : 'stable'}
        progress={productivityScore}
        animationDelay={200}
      />
      
      <KPICard
        title="Active Projects"
        value={projectsCount}
        subtitle={projectsCount > 1 ? 'multi-project' : 'focused'}
        icon={<Target />}
        color="accent"
        trend="neutral"
        trendValue="stable"
        animationDelay={300}
      />
    </div>
  );
};