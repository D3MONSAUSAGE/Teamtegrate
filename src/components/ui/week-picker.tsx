import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

interface WeekPickerProps {
  selectedWeek: Date;
  onWeekChange: (week: Date) => void;
  className?: string;
}

export function WeekPicker({ selectedWeek, onWeekChange, className = "" }: WeekPickerProps) {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(selectedWeek, 1));
  };

  const handleNextWeek = () => {
    onWeekChange(addWeeks(selectedWeek, 1));
  };

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousWeek}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="text-center min-w-[200px]">
        <div className="font-semibold">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </div>
        <div className="text-sm text-muted-foreground">
          Week of {format(weekStart, 'MMMM d')}
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextWeek}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}