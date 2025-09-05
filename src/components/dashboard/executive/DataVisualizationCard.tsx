import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface DataVisualizationCardProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  type: 'pie' | 'bar' | 'line' | 'ring';
  icon?: React.ElementType;
  className?: string;
  showLabels?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

const DataVisualizationCard: React.FC<DataVisualizationCardProps> = ({
  title,
  subtitle,
  data,
  type,
  icon: IconComponent,
  className,
  showLabels = true,
  interactive = false,
  onClick
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const renderPieChart = () => {
    let cumulativePercentage = 0;
    const radius = 45;
    const strokeWidth = 8;
    
    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg width="128" height="128" className="transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = -cumulativePercentage;
            cumulativePercentage += percentage;
            
            return (
              <circle
                key={index}
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke={item.color || `hsl(var(--primary))`}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                pathLength="100"
                className="transition-all duration-500 hover:stroke-opacity-80"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-16 text-xs text-muted-foreground truncate">
              {item.label}
            </div>
            <div className="flex-1 relative">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || 'hsl(var(--primary))'
                  }}
                />
              </div>
            </div>
            <div className="w-8 text-xs font-medium text-right">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRingChart = () => {
    const percentage = data.length > 0 ? (data[0].value / (data[0].value + (data[1]?.value || 0))) * 100 : 0;
    const radius = 40;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-24 h-24 mx-auto">
        <svg width="96" height="96" className="transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={data[0]?.color || "hsl(var(--primary))"}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {Math.round(percentage)}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return renderPieChart();
      case 'bar':
        return renderBarChart();
      case 'ring':
        return renderRingChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <Card 
      className={cn(
        "executive-card hover-lift group relative overflow-hidden",
        interactive && "cursor-pointer interactive-scale",
        className
      )}
      onClick={onClick}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {IconComponent && (
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <IconComponent className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-6">
          {renderChart()}
        </div>

        {/* Labels */}
        {showLabels && type !== 'bar' && (
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color || 'hsl(var(--primary))' }}
                  />
                  <span className="text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{item.value}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round((item.value / total) * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DataVisualizationCard;