
import React from 'react';
import CompactEnhancedTimeWidget from './CompactEnhancedTimeWidget';
import DailyTimeLog from './DailyTimeLog';
import TimeTrackingErrorBoundary from './time/TimeTrackingErrorBoundary';

const TimeTracking: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Compact Enhanced Time Widget - 1/3 width on large screens */}
      <div className="lg:col-span-1">
        <TimeTrackingErrorBoundary>
          <CompactEnhancedTimeWidget />
        </TimeTrackingErrorBoundary>
      </div>
      
      {/* Daily Time Log - 2/3 width on large screens */}
      <div className="lg:col-span-2">
        <TimeTrackingErrorBoundary>
          <DailyTimeLog />
        </TimeTrackingErrorBoundary>
      </div>
    </div>
  );
};

export default TimeTracking;
