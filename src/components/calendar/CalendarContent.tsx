import React from 'react';
import CalendarDayView from './CalendarDayView';
import CalendarWeekView from './CalendarWeekView';
import CalendarMonthView from './CalendarMonthView';
import { Task } from '@/types';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { MeetingManagementModal } from '@/components/meetings/MeetingManagementModal';

interface CalendarContentProps {
  viewType: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
  selectedDate: Date;
  tasks: Task[];
  meetings: MeetingRequestWithParticipants[];
  onTaskClick: (task: Task) => void;
  onDateCreate: (date: Date) => void;
  onMeetingManage?: () => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  projects?: Project[];
}

interface Project {
  id: string;
  title: string;
}

const CalendarContent: React.FC<CalendarContentProps> = ({
  viewType,
  onViewChange,
  selectedDate,
  tasks,
  meetings,
  onTaskClick,
  onDateCreate,
  onMeetingManage,
  onUpdateTask,
  projects = []
}) => {
  const [showMeetingModal, setShowMeetingModal] = React.useState(false);

  const handleMeetingClick = () => {
    setShowMeetingModal(true);
    onMeetingManage?.();
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      {/* Calendar Views */}
      <div className="h-full">
        {viewType === 'day' && (
          <CalendarDayView 
            selectedDate={selectedDate} 
            tasks={tasks}
            meetings={meetings}
            onTaskClick={onTaskClick}
            onDateCreate={onDateCreate}
            onMeetingClick={handleMeetingClick}
          />
        )}
        
        {viewType === 'week' && (
          <CalendarWeekView 
            selectedDate={selectedDate} 
            tasks={tasks}
            meetings={meetings}
            onTaskClick={onTaskClick}
            onDateCreate={onDateCreate}
            onMeetingClick={handleMeetingClick}
          />
        )}
        
        {viewType === 'month' && (
          <CalendarMonthView 
            selectedDate={selectedDate} 
            tasks={tasks}
            meetings={meetings}
            onTaskClick={onTaskClick}
            onDateCreate={onDateCreate}
            onMeetingClick={handleMeetingClick}
            onUpdateTask={onUpdateTask}
            projects={projects}
          />
        )}
      </div>

      {/* Meeting Management Modal */}
      <MeetingManagementModal
        open={showMeetingModal}
        onOpenChange={setShowMeetingModal}
      />
    </div>
  );
};

export default CalendarContent;