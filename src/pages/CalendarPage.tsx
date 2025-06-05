
import React from 'react';
import CalendarView from '@/components/calendar/CalendarView';
import NotificationsBanner from '@/components/notifications/NotificationsBanner';

const CalendarPage = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <NotificationsBanner />
      <CalendarView />
    </div>
  );
};

export default CalendarPage;
