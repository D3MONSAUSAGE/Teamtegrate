
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Sparkles } from 'lucide-react';

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
    <div className="flex items-center justify-between gap-4 p-4 md:p-6 glass-card border shadow-xl bg-gradient-to-br from-white/90 via-white/85 to-white/80 dark:from-card/90 dark:via-card/85 dark:to-card/80 backdrop-blur-xl rounded-2xl mb-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousMonth}
          className="h-10 w-10 p-0 rounded-full hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/10 hover:border-primary/40"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-xl border border-primary/20">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
          className="h-10 w-10 p-0 rounded-full hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/10 hover:border-primary/40"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="px-4 py-2 rounded-xl hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/10 hover:border-primary/40"
        >
          Today
        </Button>

        <Button
          size="sm"
          onClick={onAddTask}
          className="group relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-primary via-emerald-500 to-primary bg-size-200 animate-gradient hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          <span className="hidden sm:inline">Add Task</span>
          <Sparkles className="h-3 w-3 ml-1 animate-pulse" />
        </Button>
      </div>
    </div>
  );
};

export default CalendarNavigation;
