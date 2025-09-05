import React from 'react';
import { WeeklyScheduleSummary } from './WeeklyScheduleSummary';
import StreamlinedTimeControls from './StreamlinedTimeControls';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MobileTimeTrackingWidget from '@/components/mobile/MobileTimeTrackingWidget';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';

export const SimplifiedTimeTracking: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const {
    currentSession,
    isLoading: timeTrackingLoading,
    lastError,
    clockIn,
    clockOut,
    startBreak,
    endBreak
  } = useEmployeeTimeTracking();

  // Format elapsed time for mobile widget
  const formatElapsedTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  };

  // Convert session data to mobile widget format
  const elapsedTime = currentSession?.elapsedMinutes ? formatElapsedTime(currentSession.elapsedMinutes) : '00:00:00';
  const breakElapsedTime = currentSession?.breakElapsedMinutes ? formatElapsedTime(currentSession.breakElapsedMinutes) : '00:00:00';
  
  const currentEntry = {
    isClocked: currentSession?.isActive || false,
  };

  const breakState = {
    isOnBreak: currentSession?.isOnBreak || false,
    breakType: currentSession?.breakType,
  };

  return (
    <div className="space-y-6">
      {/* Weekly Schedule Summary */}
      <WeeklyScheduleSummary />
      
      {/* Time Tracking Controls */}
      {isMobile ? (
        <MobileTimeTrackingWidget
          currentEntry={currentEntry}
          elapsedTime={elapsedTime}
          isOnBreak={breakState.isOnBreak}
          breakElapsedTime={breakElapsedTime}
          lastBreakType={breakState.breakType}
          onClockIn={() => clockIn()}
          onClockOut={() => clockOut()}
          onStartBreak={(breakType) => startBreak(breakType as 'Coffee' | 'Lunch' | 'Rest')}
          onResumeFromBreak={endBreak}
          isLoading={timeTrackingLoading}
          isOnline={!lastError}
        />
      ) : (
        <StreamlinedTimeControls />
      )}
    </div>
  );
};