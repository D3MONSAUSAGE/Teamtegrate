
import React from 'react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';

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
  goToNextWeek
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={goToPrevWeek}
      >
        <CalendarDays className="h-4 w-4" />
      </Button>
      <span className="text-sm md:text-base font-medium">
        Week of {format(weekStart, "MMM d, yyyy")}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={goToNextWeek}
      >
        <CalendarDays className="h-4 w-4 rotate-180" />
      </Button>
    </div>
  );
};

export default WeekSelector;
