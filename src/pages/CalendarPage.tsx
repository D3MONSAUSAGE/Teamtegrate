
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Grid2X2, Layers, List } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const upcomingTasksCount = tasks.filter(task => {
    try {
      const taskDate = new Date(task.deadline);
      const today = new Date();
      return taskDate > today && task.status !== 'Completed';
    } catch { return false; }
  }).length;

  const overdueTasksCount = tasks.filter(task => {
    try {
      const taskDate = new Date(task.deadline);
      const today = new Date();
      return taskDate < today && task.status !== 'Completed';
    } catch { return false; }
  }).length;

  const getViewIcon = (view: string) => {
    switch(view) {
      case 'day': return List;
      case 'week': return Layers;
      case 'month': return Grid2X2;
      default: return Grid2X2;
    }
  };

  return (
    <div className="h-full flex flex-col w-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {/* Enhanced Header Section with Gradient */}
      <div className="flex-shrink-0 p-4 md:p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 border-b border-border/50 backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          {/* Title and Actions Row */}
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Calendar
              </h1>
              <p className="text-muted-foreground text-sm mt-1 hidden sm:block">
                Organize and track your tasks by date
              </p>
            </div>
            
            {/* Modern View Selector */}
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-xl p-1 border border-border/50 shadow-lg">
              {(['day', 'week', 'month'] as const).map((view) => {
                const Icon = getViewIcon(view);
                return (
                  <button
                    key={view}
                    onClick={() => setViewType(view)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200",
                      viewType === view
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="capitalize hidden sm:inline">{view}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced Navigation Bar */}
          <div className="flex items-center justify-between gap-4 p-4 bg-background/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-10 w-10 p-0 rounded-full hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  {format(selectedDate, 'MMMM yyyy')}
                </h2>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-10 w-10 p-0 rounded-full hover:scale-110 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="px-4 py-2 rounded-xl hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Today
              </Button>

              <Button
                size="sm"
                onClick={() => handleDateCreate(selectedDate)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Task</span>
              </Button>
            </div>
          </div>

          {/* Enhanced Stats Section */}
          <div className="flex items-center justify-center gap-6 py-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-200/20">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Today:</span>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
                {todayTasksCount}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-xl border border-emerald-200/20">
              <span className="text-sm font-medium text-muted-foreground">Upcoming:</span>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                {upcomingTasksCount}
              </Badge>
            </div>
            
            {overdueTasksCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500/10 to-rose-600/10 rounded-xl border border-rose-200/20">
                <span className="text-sm font-medium text-muted-foreground">Overdue:</span>
                <Badge variant="destructive" className="bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold animate-pulse">
                  {overdueTasksCount}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Calendar View */}
      <div className="flex-1 p-4 md:p-6 min-h-0 overflow-hidden">
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
