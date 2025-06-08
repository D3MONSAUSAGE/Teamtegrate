
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
    <div className="p-6 bg-background min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task Calendar</h1>
            <p className="text-muted-foreground mt-1">View and manage your tasks by date - drag to reschedule</p>
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

        {/* Date Navigation and Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold min-w-[200px]">
                {format(selectedDate, 'MMMM yyyy')}
              </h2>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              onClick={goToToday}
              className="ml-2"
            >
              Today
            </Button>

            <Button
              variant="default"
              onClick={() => handleDateCreate(selectedDate)}
              className="ml-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Today:</span>
              <Badge variant="secondary" className="font-medium">
                {todayTasksCount}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total:</span>
              <Badge variant="outline" className="font-medium">
                {tasks.length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar View - Full Width */}
      <div className="w-full">
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
