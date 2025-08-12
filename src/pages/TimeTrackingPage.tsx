
import React from 'react';
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage';
import MobileTimeTrackingWidget from '@/components/mobile/MobileTimeTrackingWidget';
import EmployeeTimeTracking from '@/components/dashboard/EmployeeTimeTracking';
import { Button } from '@/components/ui/button';
import PastTimeEntriesManager from '@/components/time-entries/PastTimeEntriesManager';

const TimeTrackingPage = () => {
  const {
    currentEntry,
    elapsedTime,
    breakElapsedTime,
    breakState,
    clockIn,
    clockOut,
    handleBreak,
    resumeFromBreak,
    isLoading,
    isOnline
  } = useTimeTrackingPage();

  const [manageOpen, setManageOpen] = React.useState(false);
  // Check if mobile view should be used
  const isMobile = window.innerWidth < 768;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Time Tracking</h1>
          <p className="text-muted-foreground">
            Professional time management with compliance monitoring and automated controls
          </p>
        </div>
        <Button variant="secondary" onClick={() => setManageOpen((v) => !v)}>
          {manageOpen ? 'Close Manage Entries' : 'Manage Entries'}
        </Button>
      </div>
      
      {isMobile ? (
        <div className="space-y-6">
          <MobileTimeTrackingWidget
            currentEntry={currentEntry}
            elapsedTime={elapsedTime}
            isOnBreak={breakState.isOnBreak}
            breakElapsedTime={breakElapsedTime}
            lastBreakType={breakState.breakType}
            onClockIn={clockIn}
            onClockOut={clockOut}
            onStartBreak={handleBreak}
            onResumeFromBreak={resumeFromBreak}
            isLoading={isLoading}
            isOnline={isOnline}
          />
        </div>
      ) : (
        <EmployeeTimeTracking />
      )}
      {manageOpen && (
        <div className="mt-6">
          <PastTimeEntriesManager />
        </div>
      )}
    </div>
  );
};

export default TimeTrackingPage;

