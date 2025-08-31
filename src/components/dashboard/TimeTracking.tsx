
import React from 'react';
import CompactTimeControls from './CompactTimeControls';
import WeeklyTimeReport from './WeeklyTimeReport';
import TimeTrackingErrorBoundary from './time/TimeTrackingErrorBoundary';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';

const TimeTracking: React.FC = () => {
  const { weeklyEntries } = useEmployeeTimeTracking();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Compact Time Controls - Smaller left column */}
      <div className="lg:col-span-2">
        <TimeTrackingErrorBoundary>
          <CompactTimeControls />
        </TimeTrackingErrorBoundary>
      </div>
      
      {/* Weekly Time Report - Larger right column for main focus */}
      <div className="lg:col-span-3">
        <TimeTrackingErrorBoundary>
          <WeeklyTimeReport entries={weeklyEntries} />
        </TimeTrackingErrorBoundary>
      </div>
    </div>
  );
};

export default TimeTracking;
