
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <Card className="h-[calc(100vh-240px)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          Week of {format(startOfWeekDate, 'MMMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center p-2 border-b font-medium text-sm">
              <div className="mb-1">{format(day, 'EEE')}</div>
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center mx-auto",
                isToday(day) && "bg-primary text-primary-foreground"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <ScrollArea className="h-[calc(100vh-350px)]">
          <div className="grid grid-cols-7 divide-x">
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
                <div key={dayIndex} className="min-h-[100px]">
                  <div className="p-2 space-y-2">
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

export default CalendarWeekView;
