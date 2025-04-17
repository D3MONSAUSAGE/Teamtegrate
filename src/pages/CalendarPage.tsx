
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isAfter, isBefore } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import TaskCard from '@/components/TaskCard';
import TaskDetailDrawer from '@/components/calendar/TaskDetailDrawer';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import CalendarWeekView from '@/components/calendar/CalendarWeekView';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import { CalendarIcon, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

const CalendarPage = () => {
  const { tasks } = useTask();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();
  
  // Function to decorate days with task indicators
  const decorateWithTaskCount = (date: Date) => {
    const tasksOnDay = tasks.filter(task => {
      try {
        const taskDeadline = new Date(task.deadline);
        return isSameDay(taskDeadline, date);
      } catch (error) {
        console.error("Invalid date for task:", task.id);
        return false;
      }
    });
    
    return tasksOnDay.length > 0 ? (
      <div className="w-full h-full flex items-center justify-center">
        <Badge variant="secondary" className="w-5 h-5 flex items-center justify-center p-0 text-xs">
          {tasksOnDay.length}
        </Badge>
      </div>
    ) : null;
  };

  // Get upcoming tasks (next 7 days)
  const getUpcomingTasks = () => {
    const now = new Date();
    const nextWeek = addDays(now, 7);
    
    return tasks
      .filter(task => {
        try {
          const taskDate = new Date(task.deadline);
          return isAfter(taskDate, now) && isBefore(taskDate, nextWeek) && task.status !== 'Completed';
        } catch (error) {
          console.error("Invalid date for task:", task.id);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        } catch (error) {
          console.error("Invalid date when sorting tasks");
          return 0;
        }
      })
      .slice(0, 5); // Get top 5 upcoming tasks
  };

  // Handle task click to open drawer with details
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const upcomingTasks = getUpcomingTasks();

  return (
    <div className="p-2 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Task Calendar</h1>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select 
            value={viewType} 
            onValueChange={(value: 'day' | 'week' | 'month') => setViewType(value)}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isMobile ? (
        // Mobile layout - stacked
        <div className="flex flex-col gap-4">
          {/* Compact calendar for date selection */}
          <Card className="w-full">
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center mb-2">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <h2 className="text-sm font-medium">Select Date</h2>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border w-full"
                components={{
                  DayContent: (props) => {
                    try {
                      const dayDate = props.date;
                      
                      return (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <span>{format(dayDate, 'd')}</span>
                          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                            {decorateWithTaskCount(dayDate)}
                          </div>
                        </div>
                      );
                    } catch (error) {
                      console.error("Error rendering day content:", error);
                      return <div>!</div>;
                    }
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Upcoming tasks */}
          <Card className="w-full">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <ListTodo className="h-4 w-4 mr-2" />
                Upcoming Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[180px]">
                {upcomingTasks.length > 0 ? (
                  <div className="px-3 py-1">
                    {upcomingTasks.map((task) => (
                      <div 
                        key={task.id} 
                        onClick={() => handleTaskClick(task)} 
                        className="flex items-center justify-between py-2 px-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded-sm group"
                      >
                        <div className="flex items-start">
                          <div className={`w-2 h-2 mt-1.5 rounded-full mr-2 flex-shrink-0 ${
                            task.priority === 'High' ? 'bg-red-500' : 
                            task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(task.deadline), 'EEE, MMM d • h:mm a')}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    No upcoming tasks
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main calendar view - make it smaller on mobile */}
          <div className="w-full">
            {viewType === 'day' && (
              <CalendarDayView 
                selectedDate={selectedDate} 
                tasks={tasks}
                onTaskClick={handleTaskClick}
              />
            )}
            
            {viewType === 'week' && (
              <CalendarWeekView 
                selectedDate={selectedDate} 
                tasks={tasks}
                onTaskClick={handleTaskClick}
              />
            )}
            
            {viewType === 'month' && (
              <CalendarMonthView 
                selectedDate={selectedDate} 
                tasks={tasks}
                onTaskClick={handleTaskClick}
              />
            )}
          </div>
        </div>
      ) : (
        // Desktop layout - side by side
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="w-full">
              <CardContent className="p-4">
                <div className="flex items-center mb-2">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <h2 className="text-sm font-medium">Select Date</h2>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border w-full"
                  components={{
                    DayContent: (props) => {
                      try {
                        const dayDate = props.date;
                        
                        return (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span>{format(dayDate, 'd')}</span>
                            <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                              {decorateWithTaskCount(dayDate)}
                            </div>
                          </div>
                        );
                      } catch (error) {
                        console.error("Error rendering day content:", error);
                        return <div>!</div>;
                      }
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            <Card className="w-full h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <ListTodo className="h-4 w-4 mr-2" />
                  Upcoming Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[200px]">
                  {upcomingTasks.length > 0 ? (
                    <div className="px-4 py-1">
                      {upcomingTasks.map((task) => (
                        <div 
                          key={task.id} 
                          onClick={() => handleTaskClick(task)} 
                          className="flex items-center justify-between py-2 px-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded-sm group"
                        >
                          <div className="flex items-start">
                            <div className={`w-2 h-2 mt-1.5 rounded-full mr-2 flex-shrink-0 ${
                              task.priority === 'High' ? 'bg-red-500' : 
                              task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <div>
                              <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{format(new Date(task.deadline), 'EEE, MMM d • h:mm a')}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      No upcoming tasks for the next 7 days
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-12">
            {viewType === 'day' && (
              <CalendarDayView 
                selectedDate={selectedDate} 
                tasks={tasks}
                onTaskClick={handleTaskClick}
              />
            )}
            
            {viewType === 'week' && (
              <CalendarWeekView 
                selectedDate={selectedDate} 
                tasks={tasks}
                onTaskClick={handleTaskClick}
              />
            )}
            
            {viewType === 'month' && (
              <CalendarMonthView 
                selectedDate={selectedDate} 
                tasks={tasks}
                onTaskClick={handleTaskClick}
              />
            )}
          </div>
        </div>
      )}
      
      <TaskDetailDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        task={selectedTask}
      />
    </div>
  );
};

export default CalendarPage;
