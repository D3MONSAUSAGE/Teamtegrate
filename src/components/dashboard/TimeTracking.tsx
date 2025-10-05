
import React from 'react';
import StreamlinedTimeControls from './StreamlinedTimeControls';
import EnhancedDailyDashboard from './EnhancedDailyDashboard';
import WeeklyTimeReport from './WeeklyTimeReport';
import TimeTrackingErrorBoundary from './time/TimeTrackingErrorBoundary';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const TimeTracking: React.FC = () => {
  const { weeklyEntries, currentSession, fetchCurrentSession, fetchDailySummary, fetchWeeklyEntries } = useEmployeeTimeTracking();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchCurrentSession(),
        fetchDailySummary(),
        fetchWeeklyEntries()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

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
