import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MetricChange {
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

interface UnifiedMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  change?: MetricChange;
  progress?: number;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
  gradient?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const UnifiedMetricCard: React.FC<UnifiedMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  progress,
  badge,
  className,
  gradient = "from-primary/10 to-primary/5",
  style,
  onClick
}) => {
  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02]",
        "bg-gradient-to-br from-card to-card/80 backdrop-blur-sm",
        onClick && "cursor-pointer",
        className
      )}
      style={style}
      onClick={onClick}
    >
      {/* Background gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", gradient)} />
      
      {/* Progress bar background */}
      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant={badge.variant || 'secondary'} className="text-xs">
              {badge.text}
            </Badge>
          )}
          <div className="p-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="space-y-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            {value}
          </div>
          
          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-xs text-muted-foreground/80">
                {subtitle}
              </p>
            )}
            
            {change && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                "bg-background/50 backdrop-blur-sm",
                getTrendColor(change.trend)
              )}>
                <span className="text-xs">{getTrendIcon(change.trend)}</span>
                {change.value}
              </div>
            )}
          </div>
          
          {progress !== undefined && (
            <Progress value={progress} className="h-2 mt-3" />
          )}
        </div>
      </CardContent>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    </Card>
  );
};