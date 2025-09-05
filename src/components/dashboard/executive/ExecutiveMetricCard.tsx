import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExecutiveMetricData {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    period: string;
  };
  progress?: {
    value: number;
    max: number;
    color?: string;
  };
  status?: {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  icon?: React.ElementType;
  sparklineData?: number[];
  actionable?: boolean;
  onClick?: () => void;
}

interface ExecutiveMetricCardProps {
  data: ExecutiveMetricData;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const ExecutiveMetricCard: React.FC<ExecutiveMetricCardProps> = ({
  data,
  variant = 'default',
  className
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
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30';
      case 'down':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30';
      default:
        return 'text-muted-foreground bg-muted/50';
    }
  };

  const renderSparkline = (data: number[]) => {
    if (!data.length) return null;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 60;
      const y = 20 - ((value - min) / range) * 15;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="absolute top-2 right-2 opacity-30 hover:opacity-60 transition-opacity">
        <svg width="64" height="24" className="text-primary">
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  const IconComponent = data.icon;

  return (
    <Card 
      className={cn(
        "executive-card hover-lift interactive-scale relative overflow-hidden group cursor-pointer",
        data.actionable && "hover:border-primary/40",
        className
      )}
      onClick={data.onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Sparkline */}
      {data.sparklineData && renderSparkline(data.sparklineData)}
      
      <div className={cn(
        "relative p-6",
        variant === 'compact' && "p-4",
        variant === 'detailed' && "p-8"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {IconComponent && (
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <IconComponent className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className={cn(
                "font-semibold text-foreground",
                variant === 'compact' ? "text-sm" : "text-base"
              )}>
                {data.title}
              </h3>
              {data.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.subtitle}
                </p>
              )}
            </div>
          </div>
          
          {data.actionable && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <div className={cn(
            "font-bold text-foreground",
            variant === 'compact' ? "text-xl" : variant === 'detailed' ? "text-4xl" : "text-3xl"
          )}>
            {data.value}
          </div>
          
          {/* Change Indicator */}
          {data.change && (
            <div className="flex items-center gap-2 mt-2">
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                getTrendColor(data.change.trend)
              )}>
                {getTrendIcon(data.change.trend)}
                <span>{data.change.value}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {data.change.period}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {data.progress && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium">
                {data.progress.value} / {data.progress.max}
              </span>
            </div>
            <Progress 
              value={(data.progress.value / data.progress.max) * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* Status Badge */}
        {data.status && (
          <div className="flex justify-between items-center">
            <Badge variant={data.status.variant} className="text-xs">
              {data.status.label}
            </Badge>
            {variant === 'detailed' && (
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted/50">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ExecutiveMetricCard;