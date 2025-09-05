import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target,
  Users,
  Calendar,
  Activity,
  Plus,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    timeframe: string;
  };
  icon?: React.ElementType;
  color?: string;
}

interface ExecutiveSummaryHeaderProps {
  userName: string;
  timeGreeting: string;
  primaryMetrics: KPIMetric[];
  onCreateTask: () => void;
  isLoading?: boolean;
}

const ExecutiveSummaryHeader: React.FC<ExecutiveSummaryHeaderProps> = ({
  userName,
  timeGreeting,
  primaryMetrics,
  onCreateTask,
  isLoading = false
}) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Executive Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl opacity-40" />
      
      <Card className="relative glass-card border-0 shadow-2xl">
        <div className="p-8 lg:p-10">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            {/* Executive Welcome Section */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {timeGreeting}
                    </p>
                    <h1 className="text-3xl xl:text-4xl font-bold text-gradient-executive">
                      {userName}
                    </h1>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-medium bg-primary/5 text-primary border-primary/20">
                    <Activity className="h-3 w-3 mr-1" />
                    Executive Dashboard
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium bg-accent/5 text-accent border-accent/20">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Badge>
                </div>
              </div>
              
              {/* Executive KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {primaryMetrics.map((metric) => {
                  const IconComponent = metric.icon || Target;
                  return (
                    <div 
                      key={metric.id}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative space-y-2 p-4 rounded-2xl hover-lift interactive-scale cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            metric.color || "bg-primary/10 text-primary"
                          )}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          {metric.change && (
                            <div className={cn(
                              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-muted/50",
                              getTrendColor(metric.change.trend)
                            )}>
                              {getTrendIcon(metric.change.trend)}
                              <span>{metric.change.value}</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <div className="text-2xl xl:text-3xl font-bold text-foreground">
                            {metric.value}
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">
                            {metric.label}
                          </div>
                          {metric.change && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {metric.change.timeframe}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Executive Actions */}
            <div className="flex-shrink-0 space-y-4">
              <div className="text-center xl:text-right space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Ready to create something great?
                </div>
                <Button
                  onClick={onCreateTask}
                  disabled={isLoading}
                  size="lg"
                  className="relative overflow-hidden bg-gradient-to-r from-primary via-primary-glow to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover-lift group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span>Create New Task</span>
                  </div>
                </Button>
              </div>
              
              <div className="flex justify-center xl:justify-end">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Team Productivity</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-600">Excellent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExecutiveSummaryHeader;