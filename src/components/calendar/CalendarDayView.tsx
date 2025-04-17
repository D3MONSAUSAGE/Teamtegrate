
import React from 'react';
import { Task } from '@/types';
import { format, isSameDay, addHours, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import CalendarTaskItem from './CalendarTaskItem';
import { Separator } from '@/components/ui/separator';

interface CalendarDayViewProps {
  selectedDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const CalendarDayView: React.FC<CalendarDayViewProps> = ({ 
  selectedDate,
  tasks,
  onTaskClick
}) => {
  const dayStart = startOfDay(selectedDate);
  const tasksForDay = tasks.filter(task => 
    isSameDay(new Date(task.deadline), selectedDate)
  );
  
  // Create time blocks for the day (hourly)
  const timeBlocks = Array.from({ length: 24 }, (_, i) => {
    const hour = addHours(dayStart, i);
    const hourTasks = tasksForDay.filter(task => {
      const taskDate = new Date(task.deadline);
      return taskDate.getHours() === hour.getHours();
    });
    
    return { hour, tasks: hourTasks };
  });
  
  return (
    <Card className="h-[calc(100vh-240px)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          {timeBlocks.map((block, index) => (
            <div key={index} className="relative">
              <div className="p-2 sticky top-0 bg-background z-10 border-b">
                <div className="text-sm font-medium text-muted-foreground">
                  {format(block.hour, 'h:mm a')}
                </div>
              </div>
              <div className="p-2">
                {block.tasks.length > 0 ? (
                  block.tasks.map(task => (
                    <CalendarTaskItem 
                      key={task.id} 
                      task={task}
                      onClick={() => onTaskClick(task)}
                    />
                  ))
                ) : (
                  <div className="py-2 px-3 text-sm text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
              {index < timeBlocks.length - 1 && <Separator />}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CalendarDayView;
