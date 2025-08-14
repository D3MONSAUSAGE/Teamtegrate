
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Sparkles, Users } from 'lucide-react';

interface CalendarNavigationProps {
  selectedDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onAddTask: () => void;
  onScheduleMeeting: () => void;
}

const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  selectedDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onAddTask,
  onScheduleMeeting
}) => {
  return (
    <div className="flex items-center justify-between gap-4 p-6 border shadow-xl bg-card rounded-2xl">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousMonth}
          className="h-10 w-10 p-0 rounded-full hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/10 hover:border-primary/40 bg-background"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            {format(selectedDate, 'MMMM yyyy')}
          </h2>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
          className="h-10 w-10 p-0 rounded-full hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/10 hover:border-primary/40 bg-background"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="px-4 py-2 rounded-xl hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg hover:bg-primary/10 hover:border-primary/40 bg-background font-medium"
        >
          Today
        </Button>

        <Button
          size="sm"
          onClick={onScheduleMeeting}
          className="group relative overflow-hidden px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 border-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-2">
            <Users className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            <span>Schedule Meeting</span>
          </div>
        </Button>

        <Button
          size="sm"
          onClick={onAddTask}
          className="group relative overflow-hidden px-6 py-2 rounded-xl bg-gradient-to-r from-primary via-purple-500 to-primary hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105 border-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-2">
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Task</span>
            <Sparkles className="h-3 w-3 animate-pulse" />
          </div>
        </Button>
      </div>
    </div>
  );
};

export default CalendarNavigation;
