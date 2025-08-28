import React, { useState } from 'react';
import { usePersonalTasks } from '@/hooks/usePersonalTasks';
import { Task } from '@/types';
import { isSameDay, addMonths, subMonths } from 'date-fns';
import TaskDetailDialog from '@/components/calendar/TaskDetailDialog';
import EnhancedCreateTaskDialog from '@/components/task/EnhancedCreateTaskDialog';
import GoogleCalendarHeader from '@/components/calendar/GoogleCalendarHeader';
import CalendarContent from '@/components/calendar/CalendarContent';
import { MeetingRequestDialog } from '@/components/meetings/MeetingRequestDialog';
import { MeetingManagementModal } from '@/components/meetings/MeetingManagementModal';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';

import { useAuth } from '@/contexts/auth/AuthProvider';

const CalendarPage = () => {
  const { tasks, isLoading } = usePersonalTasks();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState<boolean>(false);
  const [quickCreateDate, setQuickCreateDate] = useState<Date>(new Date());
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState<boolean>(false);
  const [isMeetingManagementOpen, setIsMeetingManagementOpen] = useState<boolean>(false);
  
  const { meetingRequests } = useMeetingRequests();

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

  const handleViewAllMeetings = () => {
    setIsMeetingManagementOpen(true);
  };

  const handleMeetingManagement = () => {
    setIsMeetingManagementOpen(true);
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

  // Calculate meeting stats
  const upcomingMeetingsCount = meetingRequests.filter(meeting => {
    const now = new Date();
    return new Date(meeting.start_time) > now && meeting.status !== 'cancelled';
  }).length;

  const pendingInvitationsCount = meetingRequests.filter(meeting => {
    const userParticipant = meeting.participants.find(p => p.user_id === user?.id);
    return userParticipant?.response_status === 'invited' && 
           new Date(meeting.start_time) > new Date() &&
           meeting.organizer_id !== user?.id;
  }).length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <GoogleCalendarHeader 
        selectedDate={selectedDate}
        viewType={viewType}
        onViewChange={setViewType}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
        onAddTask={() => handleDateCreate(selectedDate)}
        onScheduleMeeting={handleScheduleMeeting}
      />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-6">
            {/* Mini Calendar would go here */}
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              My calendars
            </div>
            
            {/* Stats moved to sidebar */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Today's tasks</span>
                <span className="font-medium text-blue-600">{todayTasksCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Upcoming</span>
                <span className="font-medium text-green-600">{upcomingTasksCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Meetings</span>
                <span className="font-medium text-purple-600">{upcomingMeetingsCount}</span>
              </div>
              {overdueTasksCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Overdue</span>
                  <span className="font-medium text-red-600">{overdueTasksCount}</span>
                </div>
              )}
              {pendingInvitationsCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Invitations</span>
                  <span className="font-medium text-orange-600">{pendingInvitationsCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Calendar Content */}
        <div className="flex-1">
          <CalendarContent
            viewType={viewType}
            onViewChange={setViewType}
            selectedDate={selectedDate}
            tasks={tasks}
            meetings={meetingRequests}
            onTaskClick={handleTaskClick}
            onDateCreate={handleDateCreate}
            onMeetingManage={handleMeetingManagement}
          />
        </div>
      </div>
      
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

      <MeetingManagementModal 
        open={isMeetingManagementOpen}
        onOpenChange={setIsMeetingManagementOpen}
      />
    </div>
  );
};

export default CalendarPage;
