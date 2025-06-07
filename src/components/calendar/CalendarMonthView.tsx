
import React from 'react';
import { Task } from '@/types';
import { 
  format, 
  isSameDay, 
  isSameMonth,
  startOfMonth, 
  endOfMonth,
  startOfWeek,
  endOfWeek, 
  eachDayOfInterval,
  isToday 
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import CalendarTaskItem from './CalendarTaskItem';

interface CalendarMonthViewProps {
  selectedDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ 
  selectedDate,
  tasks,
  onTaskClick
}) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  return (
    <Card className="h-[calc(100vh-240px)]">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">
          {format(selectedDate, 'MMMM yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, i) => (
            <div key={i} className="text-center p-3 font-semibold text-sm bg-muted/30 border-r last:border-r-0">
              {dayName}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <ScrollArea className="h-[calc(100vh-360px)]">
          <div className="grid grid-cols-7 auto-rows-[140px]">
            {days.map((day, i) => {
              const dayTasks = tasks.filter(task => {
                try {
                  const taskDeadline = new Date(task.deadline);
                  return isSameDay(taskDeadline, day);
                } catch (error) {
                  console.error("Invalid date for task in month view:", task.id);
                  return false;
                }
              });
              
              const withinCurrentMonth = isSameMonth(day, selectedDate);
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "border-b border-r last:border-r-0 p-2 relative min-h-[140px] hover:bg-accent/20 transition-colors",
                    !withinCurrentMonth && "bg-muted/10 text-muted-foreground"
                  )}
                >
                  {/* Day number */}
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                      isToday(day) && "bg-primary text-primary-foreground font-bold",
                      !isToday(day) && withinCurrentMonth && "hover:bg-accent",
                      !withinCurrentMonth && "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  
                  {/* Tasks */}
                  <div className="space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map(task => (
                      <CalendarTaskItem 
                        key={task.id} 
                        task={task}
                        minimal={true}
                        onClick={() => onTaskClick(task)}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <div 
                        className="text-xs text-primary cursor-pointer hover:text-primary/80 px-1 py-0.5 rounded bg-accent/30"
                        onClick={() => {
                          if (dayTasks[3]) onTaskClick(dayTasks[3]);
                        }}
                      >
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CalendarMonthView;
