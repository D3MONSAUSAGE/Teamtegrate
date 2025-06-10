
import React, { useState } from 'react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { isSameDay, addMonths, subMonths } from 'date-fns';
import TaskDetailDrawer from '@/components/calendar/TaskDetailDrawer';
import CreateTaskDialogEnhanced from '@/components/CreateTaskDialogEnhanced';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarViewSelector from '@/components/calendar/CalendarViewSelector';
import CalendarNavigation from '@/components/calendar/CalendarNavigation';
import CalendarStats from '@/components/calendar/CalendarStats';
import CalendarContent from '@/components/calendar/CalendarContent';

const CalendarPage = () => {
  const { tasks, projects } = useTask();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState<boolean>(false);
  const [quickCreateDate, setQuickCreateDate] = useState<Date>(new Date());
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

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
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  };

  const handleTaskDialogComplete = () => {
    setIsCreateTaskOpen(false);
    setEditingTask(undefined);
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

  return (
    <div className="h-full flex flex-col w-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      <CalendarHeader>
        <CalendarViewSelector 
          viewType={viewType} 
          onViewChange={setViewType} 
        />
      </CalendarHeader>

      <div className="flex-shrink-0 px-4 md:px-6">
        <CalendarNavigation
          selectedDate={selectedDate}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          onAddTask={() => handleDateCreate(selectedDate)}
        />

        <CalendarStats
          todayTasksCount={todayTasksCount}
          upcomingTasksCount={upcomingTasksCount}
          overdueTasksCount={overdueTasksCount}
        />
      </div>

      <CalendarContent
        viewType={viewType}
        selectedDate={selectedDate}
        tasks={tasks}
        onTaskClick={handleTaskClick}
        onDateCreate={handleDateCreate}
      />
      
      <TaskDetailDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        task={selectedTask}
      />

      <CreateTaskDialogEnhanced
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        onTaskComplete={handleTaskDialogComplete}
      />
    </div>
  );
};

export default CalendarPage;
