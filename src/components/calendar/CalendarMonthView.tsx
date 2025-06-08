
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
import { cn } from '@/lib/utils';
import CalendarTaskItem from './CalendarTaskItem';
import { Plus } from 'lucide-react';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';

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
  const { updateTask } = useTask();
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    try {
      // Set deadline to end of target date
      const newDeadline = new Date(targetDate);
      newDeadline.setHours(23, 59, 59, 999);
      
      await updateTask(taskId, {
        deadline: newDeadline
      });
      
      toast.success('Task rescheduled successfully');
    } catch (error) {
      console.error('Error rescheduling task:', error);
      toast.error('Failed to reschedule task');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Day headers - More compact */}
        <div className="grid grid-cols-7 border-b bg-muted/20 flex-shrink-0">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, i) => (
            <div key={i} className="text-center p-2 font-semibold text-xs border-r last:border-r-0">
              <div className="hidden sm:block">{dayName}</div>
              <div className="sm:hidden">{dayName.slice(0, 3)}</div>
            </div>
          ))}
        </div>
        
        {/* Calendar grid - Smaller cells */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-7 auto-rows-[120px] sm:auto-rows-[130px] h-full">
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
              const maxVisibleTasks = 3; // Reduced from 4
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "border-b border-r last:border-r-0 p-2 relative hover:bg-accent/10 transition-colors overflow-hidden",
                    !withinCurrentMonth && "bg-muted/5 text-muted-foreground"
                  )}
                  onDrop={(e) => handleDrop(e, day)}
                  onDragOver={handleDragOver}
                >
                  {/* Day number - More compact */}
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors",
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
                  
                  {/* Tasks - More compact */}
                  <div className="space-y-0.5 overflow-hidden">
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
                        className="text-xs text-primary cursor-pointer hover:text-primary/80 px-1 py-0.5 rounded bg-accent/50 text-center font-medium"
                        onClick={() => {
                          if (dayTasks[maxVisibleTasks]) onTaskClick(dayTasks[maxVisibleTasks]);
                        }}
                      >
                        +{dayTasks.length - maxVisibleTasks} more
                      </div>
                    )}
                    {dayTasks.length === 0 && (
                      <div 
                        className="py-1 text-xs text-center text-muted-foreground cursor-pointer hover:bg-muted/50 rounded flex items-center justify-center gap-1"
                        onClick={() => onDateCreate(day)}
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarMonthView;
