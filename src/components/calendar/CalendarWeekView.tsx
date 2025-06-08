
import React from 'react';
import { Task } from '@/types';
import { 
  format, 
  isSameDay, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isToday 
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CalendarTaskItem from './CalendarTaskItem';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface CalendarWeekViewProps {
  selectedDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateCreate: (date: Date) => void;
}

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({ 
  selectedDate,
  tasks,
  onTaskClick,
  onDateCreate
}) => {
  const startOfWeekDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const endOfWeekDate = endOfWeek(selectedDate, { weekStartsOn: 0 });
  
  const weekDays = eachDayOfInterval({
    start: startOfWeekDate,
    end: endOfWeekDate
  });
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0 px-3 py-2 md:px-6 md:py-4">
        <CardTitle className="text-sm md:text-base font-medium">
          Week of {format(startOfWeekDate, 'MMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {/* Day headers - Mobile optimized */}
        <div className="grid grid-cols-7 flex-shrink-0 border-b">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center p-2 border-r last:border-r-0 font-medium">
              <div className="mb-1 text-xs text-muted-foreground">{format(day, 'EEE')}</div>
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-medium",
                isToday(day) && "bg-primary text-primary-foreground"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        {/* Week content - Native scrolling */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7 divide-x min-h-full">
            {weekDays.map((day, dayIndex) => {
              const dayTasks = tasks.filter(task => {
                try {
                  const taskDeadline = new Date(task.deadline);
                  return isSameDay(taskDeadline, day);
                } catch (error) {
                  console.error("Invalid date for task in week view:", task.id);
                  return false;
                }
              });
              
              return (
                <div key={dayIndex} className="min-h-[120px] md:min-h-[160px] p-1 md:p-2">
                  <div className="space-y-1">
                    {dayTasks.length > 0 ? (
                      dayTasks.map(task => (
                        <CalendarTaskItem 
                          key={task.id} 
                          task={task} 
                          compact={true}
                          onClick={() => onTaskClick(task)}
                        />
                      ))
                    ) : (
                      <div 
                        className="py-2 text-xs text-center text-muted-foreground cursor-pointer hover:bg-muted/50 rounded flex items-center justify-center gap-1 border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors min-h-[40px]"
                        onClick={() => onDateCreate(day)}
                      >
                        <Plus className="h-3 w-3" />
                        <span className="hidden sm:inline">Add</span>
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

export default CalendarWeekView;
