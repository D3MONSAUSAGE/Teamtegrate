
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import TaskCard from '@/components/TaskCard';
import TaskDetailDrawer from '@/components/calendar/TaskDetailDrawer';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import CalendarWeekView from '@/components/calendar/CalendarWeekView';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import { CalendarIcon } from 'lucide-react';

const CalendarPage = () => {
  const { tasks } = useTask();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  
  // Function to decorate days with task indicators
  const decorateWithTaskCount = (date: Date) => {
    const tasksOnDay = tasks.filter(task => isSameDay(new Date(task.deadline), date));
    return tasksOnDay.length > 0 ? (
      <div className="w-full h-full flex items-center justify-center">
        <Badge variant="secondary" className="w-5 h-5 flex items-center justify-center p-0 text-xs">
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
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Task Calendar</h1>
        
        <div className="flex items-center gap-2">
          <Select 
            value={viewType} 
            onValueChange={(value: 'day' | 'week' | 'month') => setViewType(value)}
          >
            <SelectTrigger className="w-[120px]">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 xl:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <h2 className="text-sm font-medium">Select Date</h2>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                components={{
                  // Add custom day rendering with task indicators
                  DayContent: ({ day }) => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span>{format(day, 'd')}</span>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                        {decorateWithTaskCount(day)}
                      </div>
                    </div>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </div>

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
