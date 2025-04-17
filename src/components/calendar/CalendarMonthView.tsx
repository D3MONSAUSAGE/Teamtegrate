
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
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {format(selectedDate, 'MMMM yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, i) => (
            <div key={i} className="text-center p-2 border-b font-medium text-sm">
              {dayName}
            </div>
          ))}
        </div>
        <ScrollArea className="h-[calc(100vh-350px)]">
          <div className="grid grid-cols-7 auto-rows-[minmax(100px,1fr)]">
            {days.map((day, i) => {
              const dayTasks = tasks.filter(task => 
                isSameDay(new Date(task.deadline), day)
              );
              
              const withinCurrentMonth = isSameMonth(day, selectedDate);
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "border-t p-1 relative",
                    (i + 1) % 7 === 0 ? "" : "border-r",
                    !withinCurrentMonth && "bg-muted/20"
                  )}
                >
                  <div className="absolute top-1 right-1">
                    <span className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      isToday(day) && "bg-primary text-primary-foreground",
                      !isToday(day) && !withinCurrentMonth && "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="pt-6 space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <CalendarTaskItem 
                        key={task.id} 
                        task={task}
                        compact={true}
                        minimal={true}
                        onClick={() => onTaskClick(task)}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <div 
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground px-1"
                        onClick={() => {
                          if (dayTasks[0]) onTaskClick(dayTasks[0]);
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
