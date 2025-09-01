
import React from 'react';
import StreamlinedTimeControls from './StreamlinedTimeControls';
import EnhancedDailyDashboard from './EnhancedDailyDashboard';
import WeeklyTimeReport from './WeeklyTimeReport';
import TimeTrackingErrorBoundary from './time/TimeTrackingErrorBoundary';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';

const TimeTracking: React.FC = () => {
  const { weeklyEntries } = useEmployeeTimeTracking();

  return (
    <div className="space-y-6">
      {/* Top Section: Streamlined Time Controls */}
      <TimeTrackingErrorBoundary>
        <StreamlinedTimeControls />
      </TimeTrackingErrorBoundary>
      
      {/* Middle Section: Enhanced Daily Dashboard */}
      <TimeTrackingErrorBoundary>
        <EnhancedDailyDashboard />
      </TimeTrackingErrorBoundary>
      
      {/* Bottom Section: Weekly Time Report */}
      <TimeTrackingErrorBoundary>
        <WeeklyTimeReport entries={weeklyEntries} />
      </TimeTrackingErrorBoundary>
    </div>
  );
};

export default TimeTracking;
