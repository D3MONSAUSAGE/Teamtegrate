
import React from 'react';
import { Grid2X2, Layers, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarViewSelectorProps {
  viewType: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
}

const CalendarViewSelector: React.FC<CalendarViewSelectorProps> = ({ 
  viewType, 
  onViewChange 
}) => {
  const getViewIcon = (view: string) => {
    switch(view) {
      case 'day': return List;
      case 'week': return Layers;
      case 'month': return Grid2X2;
      default: return Grid2X2;
    }
  };

  return (
    <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-xl p-1 border border-border/50 shadow-lg">
      {(['day', 'week', 'month'] as const).map((view) => {
        const Icon = getViewIcon(view);
        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200",
              viewType === view
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="capitalize hidden sm:inline">{view}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CalendarViewSelector;
