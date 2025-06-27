
import React from 'react';
import CalendarDayView from './CalendarDayView';
import CalendarWeekView from './CalendarWeekView';
import CalendarMonthView from './CalendarMonthView';
import { Task } from '@/types';

interface CalendarContentProps {
  viewType: 'day' | 'week' | 'month';
  selectedDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateCreate: (date: Date) => void;
}

const CalendarContent: React.FC<CalendarContentProps> = ({
  viewType,
  selectedDate,
  tasks,
  onTaskClick,
  onDateCreate
}) => {
  return (
    <div className="h-full w-full p-6">
      <div className="h-full w-full glass-card bg-gradient-to-br from-white/50 via-white/30 to-white/10 dark:from-card/50 dark:via-card/30 dark:to-card/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
        <div className="h-full w-full p-4">
          {viewType === 'day' && (
            <CalendarDayView 
              selectedDate={selectedDate} 
              tasks={tasks}
              onTaskClick={onTaskClick}
              onDateCreate={onDateCreate}
            />
          )}
          
          {viewType === 'week' && (
            <CalendarWeekView 
              selectedDate={selectedDate} 
              tasks={tasks}
              onTaskClick={onTaskClick}
              onDateCreate={onDateCreate}
            />
          )}
          
          {viewType === 'month' && (
            <CalendarMonthView 
              selectedDate={selectedDate} 
              tasks={tasks}
              onTaskClick={onTaskClick}
              onDateCreate={onDateCreate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarContent;
