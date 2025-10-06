import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  colorClass?: string;
  className?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon,
  trend,
  colorClass,
  className
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3 text-success" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-success';
    if (trend.value < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 border-border/50", 
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              {value}
            </p>
            {trend && (
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit",
                getTrendColor(),
                trend.value > 0 ? "bg-success/10" : trend.value < 0 ? "bg-destructive/10" : "bg-muted/50"
              )}>
                {getTrendIcon()}
                <span>{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-3.5 rounded-2xl shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-3 flex-shrink-0",
            colorClass || "bg-primary text-primary-foreground"
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};