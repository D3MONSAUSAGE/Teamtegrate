
import React from 'react';
import { Task } from '@/types';
import { format, isSameDay, addHours, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CalendarTaskItem from './CalendarTaskItem';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 12) return Sunrise;
    if (hour >= 12 && hour < 18) return Sun;
    if (hour >= 18 && hour < 22) return Sunset;
    return Moon;
  };

  const getTimeGradient = (hour: number) => {
    if (hour >= 6 && hour < 12) return 'from-amber-50 to-orange-50';
    if (hour >= 12 && hour < 18) return 'from-blue-50 to-cyan-50';
    if (hour >= 18 && hour < 22) return 'from-purple-50 to-pink-50';
    return 'from-indigo-50 to-slate-50';
  };
  
  return (
    <Card className="h-full flex flex-col shadow-xl border-0 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3 flex-shrink-0 px-4 py-4 md:px-6 md:py-5 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
        <CardTitle className="text-lg md:text-xl font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="truncate">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDateCreate(selectedDate)}
            className="h-9 px-4 rounded-xl hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg bg-gradient-to-r from-primary/10 to-secondary/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="space-y-0">
          {timeBlocks.map((block, index) => {
            const TimeIcon = getTimeIcon(block.hour.getHours());
            const gradient = getTimeGradient(block.hour.getHours());
            
            return (
              <div key={index} className="relative group">
                <div className={cn(
                  "sticky top-0 bg-gradient-to-r backdrop-blur-sm z-20 border-b px-4 py-3 transition-all duration-200",
                  gradient,
                  "group-hover:shadow-md"
                )}>
                  <div className="flex items-center gap-2 text-sm md:text-base font-semibold text-foreground">
                    <TimeIcon className="h-4 w-4 text-primary" />
                    {formatTimeLabel(block.hour)}
                    <div className="ml-auto flex items-center gap-2">
                      {block.tasks.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">
                            {block.tasks.length} task{block.tasks.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      {/* Always visible add button for each time block */}
                      <button
                        onClick={() => onDateCreate(selectedDate)}
                        className="opacity-50 hover:opacity-100 transition-all duration-200 p-1 rounded-full hover:bg-primary/20 hover:scale-110"
                        title="Add task to this time"
                      >
                        <Plus className="h-3 w-3 text-primary" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 min-h-[80px] md:min-h-[100px] relative">
                  {/* Time period background */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r opacity-20 transition-opacity duration-300",
                    gradient,
                    "group-hover:opacity-30"
                  )} />
                  
                  <div className="relative z-10">
                    {block.tasks.length > 0 ? (
                      <div className="space-y-3">
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
                        className="group/add py-6 px-4 text-sm text-muted-foreground cursor-pointer hover:bg-gradient-to-br hover:from-primary/10 hover:to-secondary/10 rounded-xl transition-all duration-200 text-center border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:scale-[1.02]"
                        onClick={() => onDateCreate(selectedDate)}
                      >
                        <Plus className="h-5 w-5 mx-auto mb-2 group-hover/add:scale-110 transition-transform text-primary" />
                        <p className="font-medium">No tasks scheduled</p>
                        <p className="text-xs text-muted-foreground mt-1">Click to add a task for this time</p>
                      </div>
                    )}
                  </div>
                </div>
                {index < timeBlocks.length - 1 && <Separator className="opacity-50" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarDayView;
