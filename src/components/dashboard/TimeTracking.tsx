
import React from 'react';
import CompactTimeWidget from './CompactTimeWidget';
import DailyTimeLog from './DailyTimeLog';

const TimeTracking: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Compact Time Widget - 1/3 width on large screens */}
      <div className="lg:col-span-1">
        <CompactTimeWidget />
      </div>
      
      {/* Daily Time Log - 2/3 width on large screens */}
      <div className="lg:col-span-2">
        <DailyTimeLog />
      </div>
    </div>
  );
};

export default TimeTracking;
