import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameWeek, 
  isSameMonth,
  getWeek
} from 'date-fns';

interface CalendarWeekPickerProps {
  selectedWeek: Date;
  onWeekChange: (week: Date) => void;
  className?: string;
}

export function CalendarWeekPicker({ selectedWeek, onWeekChange, className = "" }: CalendarWeekPickerProps) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedWeek.getFullYear(), selectedWeek.getMonth()));

  // Generate calendar days for the current view month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    // Group days by weeks
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    days.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return weeks;
  }, [viewMonth]);

  const handlePreviousMonth = () => {
    setViewMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(prev => addMonths(prev, 1));
  };

  const handleWeekClick = (weekStartDay: Date) => {
    const weekStart = startOfWeek(weekStartDay, { weekStartsOn: 1 });
    onWeekChange(weekStart);
  };

  const isWeekSelected = (weekStartDay: Date) => {
    return isSameWeek(weekStartDay, selectedWeek, { weekStartsOn: 1 });
  };

  const selectedWeekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const selectedWeekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <div className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(viewMonth, 'MMMM yyyy')}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected week display */}
      <div className="text-center p-3 bg-primary/10 rounded-md border">
        <div className="text-sm font-medium text-primary">
          Selected Week
        </div>
        <div className="text-lg font-semibold">
          {format(selectedWeekStart, 'MMM d')} - {format(selectedWeekEnd, 'MMM d, yyyy')}
        </div>
        <div className="text-xs text-muted-foreground">
          Week {getWeek(selectedWeek, { weekStartsOn: 1 })} of {format(selectedWeek, 'yyyy')}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-xs font-medium text-muted-foreground text-center p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="space-y-1">
          {calendarDays.map((week, weekIndex) => {
            const weekStart = startOfWeek(week[0], { weekStartsOn: 1 });
            const isSelected = isWeekSelected(week[0]);
            
            return (
              <div key={weekIndex} className="relative">
                <Button
                  variant="ghost"
                  className={`
                    w-full h-auto p-0 rounded-md transition-all
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20' 
                      : 'hover:bg-muted/80'
                    }
                  `}
                  onClick={() => handleWeekClick(week[0])}
                >
                  <div className="grid grid-cols-7 gap-1 w-full p-1">
                    {week.map((day, dayIndex) => {
                      const isCurrentMonth = isSameMonth(day, viewMonth);
                      const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      
                      return (
                        <div
                          key={dayIndex}
                          className={`
                            aspect-square flex items-center justify-center text-sm rounded
                            ${!isCurrentMonth 
                              ? 'text-muted-foreground/40' 
                              : isSelected 
                                ? 'text-primary-foreground' 
                                : 'text-foreground'
                            }
                            ${isToday && !isSelected ? 'bg-primary/20 font-semibold' : ''}
                            ${isToday && isSelected ? 'bg-primary-foreground/20 font-semibold' : ''}
                          `}
                        >
                          {format(day, 'd')}
                        </div>
                      );
                    })}
                  </div>
                </Button>
                
                {/* Week number indicator */}
                <div className={`
                  absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6
                  text-xs font-medium w-4 text-center
                  ${isSelected ? 'text-primary font-semibold' : 'text-muted-foreground'}
                `}>
                  W{getWeek(weekStart, { weekStartsOn: 1 })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}