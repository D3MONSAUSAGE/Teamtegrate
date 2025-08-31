import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernMetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon: React.ComponentType<{ className?: string }>;
  progress?: number;
  className?: string;
  description?: string;
  gradient?: string;
}

const ModernMetricCard: React.FC<ModernMetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  progress,
  className,
  description,
  gradient = "from-primary/10 to-accent/10"
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
    <Card className={cn(
      "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02]",
      "bg-gradient-to-br from-card to-card/80 backdrop-blur-sm",
      className
    )}>
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
      
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          
          {change && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
              "bg-background/50 backdrop-blur-sm",
              getTrendColor(change.trend)
            )}>
              <span className="text-xs">{getTrendIcon(change.trend)}</span>
              {change.value}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </h3>
          
          <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            {value}
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground/80">
              {description}
            </p>
          )}
        </div>
      </CardContent>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    </Card>
  );
};

export default ModernMetricCard;