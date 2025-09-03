import React from 'react';
import { UnifiedMetricCard } from './UnifiedMetricCard';
import { LucideIcon } from 'lucide-react';

export interface MetricData {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  progress?: number;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  gradient?: string;
  onClick?: () => void;
}

interface MetricCardsGridProps {
  metrics: MetricData[];
  isLoading?: boolean;
  className?: string;
  columns?: 'auto' | 1 | 2 | 3 | 4;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({
  metrics,
  isLoading = false,
  className = '',
  columns = 'auto'
}) => {
  const getGridCols = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    }
  };

  if (isLoading) {
    return (
      <div className={`grid ${getGridCols()} gap-6 ${className}`}>
        {Array.from({ length: metrics.length || 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${getGridCols()} gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <UnifiedMetricCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          icon={metric.icon}
          change={metric.change}
          progress={metric.progress}
          badge={metric.badge}
          gradient={metric.gradient}
          onClick={metric.onClick}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
        />
      ))}
    </div>
  );
};