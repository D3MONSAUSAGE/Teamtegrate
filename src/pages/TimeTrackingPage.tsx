import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileTimeTrackingPage from './MobileTimeTrackingPage';
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage';
import MobileTimeTrackingWidget from '@/components/mobile/MobileTimeTrackingWidget';
import EmployeeTimeTracking from '@/components/dashboard/EmployeeTimeTracking';

const TimeTrackingPage = () => {
  const isMobile = useIsMobile();

  // Render mobile version for mobile devices
  if (isMobile) {
    return <MobileTimeTrackingPage />;
  }

  // Keep all existing desktop code unchanged
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
      
      <EmployeeTimeTracking />
    </div>
  );
};

export default TimeTrackingPage;
