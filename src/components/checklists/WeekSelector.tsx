
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface WeekSelectorProps {
  weekStart: Date;
  setWeekStart: (date: Date) => void;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({
  weekStart,
  setWeekStart,
  goToPrevWeek,
  goToNextWeek,
}) => {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  return (
    <div className="flex items-center justify-between max-w-full mb-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={goToPrevWeek}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-medium">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </span>
        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="ml-2"
        onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
      >
        This Week
      </Button>
    </div>
  );
};

export default WeekSelector;
