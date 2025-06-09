
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
    <div className="flex-1 p-4 md:p-6 min-h-0 overflow-hidden">
      <div className="h-full w-full">
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
  );
};

export default CalendarContent;
