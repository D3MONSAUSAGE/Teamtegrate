
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
    <div className="h-screen flex flex-col">
      {/* Header Section - More compact */}
      <div className="flex-shrink-0 p-4 pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Task Calendar</h1>
            <p className="text-muted-foreground text-sm mt-1">View and manage your tasks by date - drag to reschedule</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select 
              value={viewType} 
              onValueChange={(value: 'day' | 'week' | 'month') => setViewType(value)}
            >
              <SelectTrigger className="w-[120px] h-9">
                <Filter className="mr-2 h-4 w-4" />
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

        {/* Date Navigation and Stats - More compact */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold min-w-[160px]">
                {format(selectedDate, 'MMMM yyyy')}
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="ml-2 h-8"
            >
              Today
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => handleDateCreate(selectedDate)}
              className="ml-2 h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </div>

          {/* Quick Stats - More compact */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">Today:</span>
              <Badge variant="secondary" className="text-xs h-5">
                {todayTasksCount}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-xs">Total:</span>
              <Badge variant="outline" className="text-xs h-5">
                {tasks.length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar View - Takes remaining space */}
      <div className="flex-1 px-4 pb-4 min-h-0">
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
