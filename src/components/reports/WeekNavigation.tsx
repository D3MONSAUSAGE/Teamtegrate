import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeekNavigationProps {
  selectedWeek: Date;
  onWeekChange: (date: Date) => void;
  className?: string;
}

export const WeekNavigation: React.FC<WeekNavigationProps> = ({
  selectedWeek,
  onWeekChange,
  className
}) => {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  const handlePrevWeek = () => {
    onWeekChange(subWeeks(selectedWeek, 1));
  };

  const handleNextWeek = () => {
    onWeekChange(addWeeks(selectedWeek, 1));
  };

  const handleCurrentWeek = () => {
    onWeekChange(new Date());
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePrevWeek}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-3 min-w-[280px] justify-center">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">
          {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
        </span>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleNextWeek}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleCurrentWeek}
        className="text-xs text-muted-foreground hover:text-primary"
      >
        Today
      </Button>
    </div>
  );
};