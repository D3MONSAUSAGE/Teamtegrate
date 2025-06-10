
import React from 'react';
import { Grid2X2, Layers, List, Sparkles } from 'lucide-react';
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

  const getViewLabel = (view: string) => {
    switch(view) {
      case 'day': return 'Day View';
      case 'week': return 'Week View';
      case 'month': return 'Month View';
      default: return 'Month View';
    }
  };

  return (
    <div className="flex items-center gap-2 glass-card bg-background/80 backdrop-blur-xl rounded-xl p-1 border-2 border-border/30 shadow-lg">
      {(['day', 'week', 'month'] as const).map((view) => {
        const Icon = getViewIcon(view);
        const isActive = viewType === view;
        
        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={cn(
              "group relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-300 overflow-hidden",
              isActive
                ? "bg-gradient-to-r from-primary via-emerald-500 to-primary text-primary-foreground shadow-lg scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:scale-105"
            )}
          >
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50" />
            )}
            <Icon className={cn(
              "h-4 w-4 transition-all duration-300",
              isActive ? "text-white" : "group-hover:scale-110"
            )} />
            <span className="capitalize hidden sm:inline relative z-10">{view}</span>
            {isActive && (
              <Sparkles className="h-3 w-3 text-white/80 animate-pulse hidden md:inline" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CalendarViewSelector;
