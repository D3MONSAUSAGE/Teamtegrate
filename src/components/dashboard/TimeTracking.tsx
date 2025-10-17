
import React from 'react';
import StreamlinedTimeControls from './StreamlinedTimeControls';
import EnhancedDailyDashboard from './EnhancedDailyDashboard';
import WeeklyTimeReport from './WeeklyTimeReport';
import TimeTrackingErrorBoundary from './time/TimeTrackingErrorBoundary';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const TimeTracking: React.FC = () => {
  const { weeklyEntries, currentSession, fetchCurrentSession, fetchDailySummary, fetchWeeklyEntries, realtimeConnected } = useTimeTracking();
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
      {/* Refresh Button & Connection Status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="text-sm text-muted-foreground">
            {realtimeConnected ? 'Live Updates Active' : 'Updates via Polling'}
          </span>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
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
