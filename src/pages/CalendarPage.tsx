
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
    <div className="h-screen flex flex-col w-full max-w-full overflow-hidden">
      {/* Header Section - More compact */}
      <div className="flex-shrink-0 p-3 md:p-4 pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">Task Calendar</h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">View and manage your tasks by date - drag to reschedule</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Select 
              value={viewType} 
              onValueChange={(value: 'day' | 'week' | 'month') => setViewType(value)}
            >
              <SelectTrigger className="w-[100px] md:w-[120px] h-8 md:h-9">
                <Filter className="mr-1 md:mr-2 h-3 md:h-4 w-3 md:w-4" />
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
        <div className="flex flex-col gap-3 p-2 md:p-3 bg-muted/30 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-1 md:gap-2 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-7 md:h-8 w-7 md:w-8 p-0"
              >
                <ChevronLeft className="h-3 md:h-4 w-3 md:w-4" />
              </Button>
              
              <div className="flex items-center gap-1 md:gap-2 min-w-0">
                <CalendarIcon className="h-3 md:h-4 w-3 md:w-4 text-primary flex-shrink-0" />
                <h2 className="text-sm md:text-base font-semibold truncate">
                  {format(selectedDate, 'MMMM yyyy')}
                </h2>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-7 md:h-8 w-7 md:w-8 p-0"
              >
                <ChevronRight className="h-3 md:h-4 w-3 md:w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="ml-1 md:ml-2 h-7 md:h-8 text-xs md:text-sm px-2 md:px-3"
              >
                Today
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleDateCreate(selectedDate)}
                className="ml-1 md:ml-2 h-7 md:h-8 text-xs md:text-sm px-2 md:px-3"
              >
                <Plus className="h-3 md:h-4 w-3 md:w-4 mr-1" />
                <span className="hidden sm:inline">Add Task</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>

            {/* Quick Stats - More compact */}
            <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm flex-shrink-0">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Today:</span>
                <Badge variant="secondary" className="text-xs h-4 md:h-5">
                  {todayTasksCount}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Total:</span>
                <Badge variant="outline" className="text-xs h-4 md:h-5">
                  {tasks.length}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar View - Takes remaining space */}
      <div className="flex-1 px-3 md:px-4 pb-3 md:pb-4 min-h-0 overflow-hidden">
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
