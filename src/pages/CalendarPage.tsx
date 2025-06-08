
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { format, isSameDay, addMonths, subMonths } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TaskDetailDrawer from '@/components/calendar/TaskDetailDrawer';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import CalendarWeekView from '@/components/calendar/CalendarWeekView';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import QuickTaskCreateDialog from '@/components/calendar/QuickTaskCreateDialog';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Clock, Plus } from 'lucide-react';

const CalendarPage = () => {
  const { tasks, projects } = useTask();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState<boolean>(false);
  const [quickCreateDate, setQuickCreateDate] = useState<Date>(new Date());

  // Handle task click to open drawer with details
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const goToPreviousMonth = () => {
    setSelectedDate(subMonths(selectedDate, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(addMonths(selectedDate, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateCreate = (date: Date) => {
    setQuickCreateDate(date);
    setIsQuickCreateOpen(true);
  };

  const todayTasksCount = tasks.filter(task => {
    try {
      return isSameDay(new Date(task.deadline), new Date());
    } catch { return false; }
  }).length;

  return (
    <div className="h-full flex flex-col w-full overflow-hidden">
      {/* Mobile-optimized Header Section */}
      <div className="flex-shrink-0 p-2 md:p-4">
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">Calendar</h1>
              <p className="text-muted-foreground text-xs hidden sm:block">Manage your tasks by date</p>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <Select 
                value={viewType} 
                onValueChange={(value: 'day' | 'week' | 'month') => setViewType(value)}
              >
                <SelectTrigger className="w-[80px] md:w-[120px] h-8 md:h-9 text-xs md:text-sm">
                  <Filter className="mr-1 h-3 w-3 md:h-4 md:w-4" />
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

          {/* Compact Date Navigation */}
          <div className="flex items-center justify-between gap-2 p-2 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 min-w-0">
                <CalendarIcon className="h-4 w-4 text-primary flex-shrink-0" />
                <h2 className="text-sm md:text-base font-semibold truncate">
                  {format(selectedDate, 'MMM yyyy')}
                </h2>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="h-8 text-xs px-2"
              >
                Today
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleDateCreate(selectedDate)}
                className="h-8 text-xs px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Add</span>
              </Button>
            </div>
          </div>

          {/* Simplified Stats - Hidden on small mobile */}
          <div className="hidden sm:flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Today:</span>
              <Badge variant="secondary" className="text-xs h-4">
                {todayTasksCount}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Total:</span>
              <Badge variant="outline" className="text-xs h-4">
                {tasks.length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar View - Mobile optimized */}
      <div className="flex-1 px-2 md:px-4 pb-2 md:pb-4 min-h-0 overflow-hidden">
        <div className="h-full w-full">
          {viewType === 'day' && (
            <CalendarDayView 
              selectedDate={selectedDate} 
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onDateCreate={handleDateCreate}
            />
          )}
          
          {viewType === 'week' && (
            <CalendarWeekView 
              selectedDate={selectedDate} 
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onDateCreate={handleDateCreate}
            />
          )}
          
          {viewType === 'month' && (
            <CalendarMonthView 
              selectedDate={selectedDate} 
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onDateCreate={handleDateCreate}
            />
          )}
        </div>
      </div>
      
      <TaskDetailDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        task={selectedTask}
      />

      <QuickTaskCreateDialog
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        selectedDate={quickCreateDate}
        projects={projects}
      />
    </div>
  );
};

export default CalendarPage;
