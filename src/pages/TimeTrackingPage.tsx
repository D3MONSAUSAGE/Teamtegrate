
import React from 'react';
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage';
import MobileTimeTrackingWidget from '@/components/mobile/MobileTimeTrackingWidget';
import EmployeeTimeTracking from '@/components/dashboard/EmployeeTimeTracking';

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
    </div>
  );
};

export default TimeTrackingPage;

