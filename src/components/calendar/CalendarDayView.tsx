
import React from 'react';
import { Task } from '@/types';
import { format, isSameDay, addHours, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CalendarTaskItem from './CalendarTaskItem';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CalendarDayViewProps {
  selectedDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateCreate: (date: Date) => void;
}

const CalendarDayView: React.FC<CalendarDayViewProps> = ({ 
  selectedDate,
  tasks,
  onTaskClick,
  onDateCreate
}) => {
  const dayStart = startOfDay(selectedDate);
  const tasksForDay = tasks.filter(task => {
    try {
      const taskDeadline = new Date(task.deadline);
      return isSameDay(taskDeadline, selectedDate);
    } catch (error) {
      console.error("Invalid date for task in day view:", task.id);
      return false;
    }
  });
  
  // Create time blocks for the day (hourly)
  const timeBlocks = Array.from({ length: 24 }, (_, i) => {
    const hour = addHours(dayStart, i);
    const hourTasks = tasksForDay.filter(task => {
      try {
        const taskDate = new Date(task.deadline);
        return taskDate.getHours() === hour.getHours();
      } catch (error) {
        console.error("Invalid task date in hour filtering:", task.id);
        return false;
      }
    });
    
    return { hour, tasks: hourTasks };
  });
  
  const formatTimeLabel = (date: Date) => {
    try {
      return format(date, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0 px-3 py-2 md:px-6 md:py-4">
        <CardTitle className="text-sm md:text-base font-medium flex items-center justify-between">
          <span className="truncate">{format(selectedDate, 'EEE, MMM d, yyyy')}</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDateCreate(selectedDate)}
            className="h-7 text-xs px-2 ml-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="space-y-0">
          {timeBlocks.map((block, index) => (
            <div key={index} className="relative">
              <div className="sticky top-0 bg-background z-10 border-b px-3 py-2">
                <div className="text-xs md:text-sm font-medium text-muted-foreground">
                  {formatTimeLabel(block.hour)}
                </div>
              </div>
              <div className="px-3 py-2 min-h-[60px] md:min-h-[80px]">
                {block.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {block.tasks.map(task => (
                      <CalendarTaskItem 
                        key={task.id} 
                        task={task}
                        onClick={() => onTaskClick(task)}
                      />
                    ))}
                  </div>
                ) : (
                  <div 
                    className="py-4 px-3 text-xs md:text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded transition-colors text-center border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40"
                    onClick={() => onDateCreate(selectedDate)}
                  >
                    <Plus className="h-4 w-4 mx-auto mb-1" />
                    Tap to add task
                  </div>
                )}
              </div>
              {index < timeBlocks.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarDayView;
