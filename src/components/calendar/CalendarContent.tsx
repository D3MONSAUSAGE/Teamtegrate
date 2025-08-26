
import React from 'react';
import CalendarDayView from './CalendarDayView';
import CalendarWeekView from './CalendarWeekView';
import CalendarMonthView from './CalendarMonthView';
import CalendarViewSelector from './CalendarViewSelector';
import { Task } from '@/types';
import { MeetingRequestWithParticipants } from '@/types/meeting';

interface CalendarContentProps {
  viewType: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
  selectedDate: Date;
  tasks: Task[];
  meetings: MeetingRequestWithParticipants[];
  onTaskClick: (task: Task) => void;
  onDateCreate: (date: Date) => void;
}

const CalendarContent: React.FC<CalendarContentProps> = ({
  viewType,
  onViewChange,
  selectedDate,
  tasks,
  meetings,
  onTaskClick,
  onDateCreate
}) => {
  return (
    <div className="h-full w-full p-6">
      <div className="h-full w-full glass-card bg-gradient-to-br from-white/50 via-white/30 to-white/10 dark:from-card/50 dark:via-card/30 dark:to-card/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
        <div className="h-full w-full p-4">
          {/* Header with View Selector */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)} View
              </h3>
              <p className="text-muted-foreground mt-1">
                Organize and manage your tasks by date
              </p>
            </div>
            <CalendarViewSelector 
              viewType={viewType} 
              onViewChange={onViewChange} 
            />
          </div>

          {/* Calendar Views */}
          <div className="h-[calc(100%-120px)]">
            {viewType === 'day' && (
              <CalendarDayView 
                selectedDate={selectedDate} 
                tasks={tasks}
                meetings={meetings}
                onTaskClick={onTaskClick}
                onDateCreate={onDateCreate}
              />
            )}
            
            {viewType === 'week' && (
              <CalendarWeekView 
                selectedDate={selectedDate} 
                tasks={tasks}
                meetings={meetings}
                onTaskClick={onTaskClick}
                onDateCreate={onDateCreate}
              />
            )}
            
            {viewType === 'month' && (
              <CalendarMonthView 
                selectedDate={selectedDate} 
                tasks={tasks}
                meetings={meetings}
                onTaskClick={onTaskClick}
                onDateCreate={onDateCreate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarContent;
