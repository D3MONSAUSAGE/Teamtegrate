
import React from 'react';
import TimeTracking from '@/components/dashboard/TimeTracking';

const TimeTrackingPage = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Time Tracking</h1>
      <TimeTracking />
    </div>
  );
};

export default TimeTrackingPage;
