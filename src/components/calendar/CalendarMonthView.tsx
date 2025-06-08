
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
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import CalendarTaskItem from './CalendarTaskItem';
import { Plus } from 'lucide-react';

interface CalendarMonthViewProps {
  selectedDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateCreate: (date: Date) => void;
}

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ 
  selectedDate,
  tasks,
  onTaskClick,
  onDateCreate
}) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    // We'll implement the reschedule logic here
    console.log('Dropped task', taskId, 'on date', targetDate);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  return (
    <Card className="h-[calc(100vh-300px)]">
      <CardContent className="p-0">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/20">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, i) => (
            <div key={i} className="text-center p-4 font-semibold text-sm border-r last:border-r-0">
              <div className="hidden sm:block">{dayName}</div>
              <div className="sm:hidden">{dayName.slice(0, 3)}</div>
            </div>
          ))}
        </div>
        
        {/* Calendar grid with increased height */}
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="grid grid-cols-7 auto-rows-[180px] sm:auto-rows-[200px]">
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
              const maxVisibleTasks = 4;
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "border-b border-r last:border-r-0 p-3 relative hover:bg-accent/10 transition-colors",
                    !withinCurrentMonth && "bg-muted/5 text-muted-foreground"
                  )}
                  onDrop={(e) => handleDrop(e, day)}
                  onDragOver={handleDragOver}
                >
                  {/* Day number with better styling */}
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      isToday(day) && "bg-primary text-primary-foreground font-bold shadow-md",
                      !isToday(day) && withinCurrentMonth && "hover:bg-accent",
                      !withinCurrentMonth && "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <div className="text-xs text-muted-foreground font-medium">
                        {dayTasks.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Tasks with improved spacing */}
                  <div className="space-y-1 overflow-hidden">
                    {dayTasks.slice(0, maxVisibleTasks).map(task => (
                      <CalendarTaskItem 
                        key={task.id} 
                        task={task}
                        minimal={true}
                        onClick={() => onTaskClick(task)}
                        draggable={true}
                      />
                    ))}
                    {dayTasks.length > maxVisibleTasks && (
                      <div 
                        className="text-xs text-primary cursor-pointer hover:text-primary/80 px-2 py-1 rounded bg-accent/50 text-center font-medium"
                        onClick={() => {
                          if (dayTasks[maxVisibleTasks]) onTaskClick(dayTasks[maxVisibleTasks]);
                        }}
                      >
                        +{dayTasks.length - maxVisibleTasks} more
                      </div>
                    )}
                    {dayTasks.length === 0 && (
                      <div 
                        className="py-2 text-xs text-center text-muted-foreground cursor-pointer hover:bg-muted/50 rounded flex items-center justify-center gap-1"
                        onClick={() => onDateCreate(day)}
                      >
                        <Plus className="h-3 w-3" />
                        Add task
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
