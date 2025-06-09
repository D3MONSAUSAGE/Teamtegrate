
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';

interface CalendarNavigationProps {
  selectedDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onAddTask: () => void;
}

const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  selectedDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onAddTask
}) => {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-background/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousMonth}
          className="h-10 w-10 p-0 rounded-full hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
          className="h-10 w-10 p-0 rounded-full hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="px-4 py-2 rounded-xl hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Today
        </Button>

        <Button
          size="sm"
          onClick={onAddTask}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Add Task</span>
        </Button>
      </div>
    </div>
  );
};

export default CalendarNavigation;
