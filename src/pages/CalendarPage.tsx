
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import TaskDetailDrawer from '@/components/calendar/TaskDetailDrawer';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import CalendarWeekView from '@/components/calendar/CalendarWeekView';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import { CalendarIcon, Filter } from 'lucide-react';

const CalendarPage = () => {
  const { tasks } = useTask();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  
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
      <div className="absolute bottom-0 right-0">
        <Badge variant="secondary" className="w-5 h-5 flex items-center justify-center p-0 text-xs rounded-full bg-primary text-primary-foreground">
          {tasksOnDay.length}
        </Badge>
      </div>
    ) : null;
  };

  // Handle task click to open drawer with details
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage your tasks by date</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select 
            value={viewType} 
            onValueChange={(value: 'day' | 'week' | 'month') => setViewType(value)}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="month">Month View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar with mini calendar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="sticky top-6">
            <CardContent className="p-4">
              <div className="flex items-center mb-4">
                <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Select Date</h2>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border-0"
                components={{
                  DayContent: (props) => {
                    const dayDate = props.date;
                    
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span className="relative z-10">{format(dayDate, 'd')}</span>
                        {decorateWithTaskCount(dayDate)}
                      </div>
                    );
                  },
                }}
              />
              
              {/* Quick stats */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Quick Stats</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Total Tasks:</span>
                    <span className="font-medium">{tasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Today:</span>
                    <span className="font-medium">
                      {tasks.filter(task => {
                        try {
                          return isSameDay(new Date(task.deadline), new Date());
                        } catch { return false; }
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main calendar view */}
        <div className="lg:col-span-8 xl:col-span-9">
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
      
      <TaskDetailDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        task={selectedTask}
      />
    </div>
  );
};

export default CalendarPage;
