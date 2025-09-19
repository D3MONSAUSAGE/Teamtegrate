import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Task } from '@/types';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface CompactCalendarWidgetProps {
  tasks: Task[];
  onCreateTask: () => void;
  onDateSelect?: (date: Date) => void;
}

const CompactCalendarWidget: React.FC<CompactCalendarWidgetProps> = ({
  tasks,
  onCreateTask,
  onDateSelect
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Get tasks for each date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return isSameDay(taskDate, date);
    });
  };

  // Get task count and types for a date
  const getDateInfo = (date: Date) => {
    const dateTasks = getTasksForDate(date);
    const completed = dateTasks.filter(t => t.status === 'Completed').length;
    const overdue = dateTasks.filter(t => {
      const now = new Date();
      const taskDate = new Date(t.deadline);
      return taskDate < now && t.status !== 'Completed';
    }).length;
    const high = dateTasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
    
    return { total: dateTasks.length, completed, overdue, high };
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const selectedDateTasks = getTasksForDate(selectedDate);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </span>
          <Button
            onClick={onCreateTask}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini Calendar */}
        <div className="relative">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="p-0 scale-90 origin-top-left w-[320px] h-[280px]"
            classNames={{
              months: "flex",
              month: "space-y-2",
              caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-6 w-6 bg-transparent p-0 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.7rem]",
              row: "flex w-full mt-1",
              cell: `relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md`,
              day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors relative text-xs",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground font-semibold",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible"
            }}
            components={{
              Day: ({ date, displayMonth, ...props }) => {
                const info = getDateInfo(date);
                return (
                  <div className="relative">
                    <button {...props}>
                      {format(date, 'd')}
                    </button>
                    {info.total > 0 && (
                      <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {info.overdue > 0 && (
                          <div className="w-1 h-1 bg-red-500 rounded-full" />
                        )}
                        {info.high > 0 && (
                          <div className="w-1 h-1 bg-orange-500 rounded-full" />
                        )}
                        {info.completed > 0 && (
                          <div className="w-1 h-1 bg-green-500 rounded-full" />
                        )}
                        {info.total > info.completed + info.overdue + info.high && (
                          <div className="w-1 h-1 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            }}
          />
        </div>

        {/* Selected Date Tasks */}
        {selectedDateTasks.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <div className="text-xs font-medium text-muted-foreground">
              {format(selectedDate, 'MMM d, yyyy')} ({selectedDateTasks.length})
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {selectedDateTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    task.status === 'Completed' ? 'bg-green-500' :
                    task.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <span className="truncate flex-1">{task.title}</span>
                  {task.priority === 'High' && (
                    <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                      H
                    </Badge>
                  )}
                </div>
              ))}
              {selectedDateTasks.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{selectedDateTasks.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            Overdue
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Done
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
            High
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactCalendarWidget;