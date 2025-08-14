import React, { useState } from 'react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import { isSameDay, addMonths, subMonths } from 'date-fns';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarNavigation from '@/components/calendar/CalendarNavigation';
import CalendarStats from '@/components/calendar/CalendarStats';
import CalendarContent from '@/components/calendar/CalendarContent';
import ModernSectionCard from '@/components/dashboard/ModernSectionCard';
import SectionContainer from '@/components/shared/SectionContainer';
import { MeetingRequestDialog } from '@/components/meetings/MeetingRequestDialog';
import { MeetingNotifications } from '@/components/meetings/MeetingNotifications';
import { Calendar as CalendarIcon, Navigation, BarChart } from 'lucide-react';

const CalendarPage = () => {
  const { tasks, projects } = useTask();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState<boolean>(false);
  const [quickCreateDate, setQuickCreateDate] = useState<Date>(new Date());
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState<boolean>(false);

  // Handle task click to open dialog with details
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
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

  const handleScheduleMeeting = () => {
    setIsMeetingDialogOpen(true);
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
    <div className="relative">
      {/* Background with gradient effects within content area */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.1),transparent_50%)] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(147,51,234,0.1),transparent_50%)] -z-10" />
      
      <SectionContainer maxWidth="7xl" className="py-8 space-y-8">
        {/* Enhanced Calendar Header */}
        <div className="animate-fade-in">
          <CalendarHeader />
        </div>

        {/* Calendar Navigation Card */}
        <div className="animate-fade-in delay-75">
          <ModernSectionCard
            title="Calendar Navigation"
            icon={Navigation}
            gradient="from-blue-500/10 via-primary/5 to-purple-500/10"
            noPadding
          >
            <div className="p-4">
              <CalendarNavigation
                selectedDate={selectedDate}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                onToday={goToToday}
                onAddTask={() => handleDateCreate(selectedDate)}
                onScheduleMeeting={handleScheduleMeeting}
              />
            </div>
          </ModernSectionCard>
        </div>

        {/* Calendar Stats Card */}
        <div className="animate-fade-in delay-100">
          <ModernSectionCard
            title="Task Overview"
            subtitle="Quick insights into your schedule"
            icon={BarChart}
            gradient="from-emerald-500/10 via-green-500/5 to-blue-500/10"
            noPadding
          >
            <div className="p-4">
              <CalendarStats
                todayTasksCount={todayTasksCount}
                upcomingTasksCount={upcomingTasksCount}
                overdueTasksCount={overdueTasksCount}
                upcomingMeetingsCount={0} // TODO: Add meeting data when available
                pendingInvitationsCount={0} // TODO: Add invitation data when available
              />
            </div>
          </ModernSectionCard>
        </div>

        {/* Meeting Notifications */}
        <div className="animate-fade-in delay-150">
          <MeetingNotifications />
        </div>

        {/* Calendar Content Card */}
        <div className="animate-fade-in delay-200">
          <ModernSectionCard
            title="Calendar"
            subtitle="Organize and manage your tasks by date"
            icon={CalendarIcon}
            gradient="from-primary/10 via-blue-500/5 to-indigo-500/10"
            className="min-h-[600px]"
            noPadding
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Schedule</h3>
                <div className="flex gap-2">
                  <MeetingRequestDialog defaultDate={selectedDate} />
                </div>
              </div>
            </div>
            <CalendarContent
              viewType={viewType}
              onViewChange={setViewType}
              selectedDate={selectedDate}
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onDateCreate={handleDateCreate}
            />
          </ModernSectionCard>
        </div>
      </SectionContainer>
      
      <TaskDetailDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={selectedTask}
      />

      <EnhancedCreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        onTaskComplete={handleTaskDialogComplete}
      />

      <MeetingRequestDialog 
        trigger={null}
        defaultDate={selectedDate}
        open={isMeetingDialogOpen}
        onOpenChange={setIsMeetingDialogOpen}
      />
    </div>
  );
};

export default CalendarPage;
