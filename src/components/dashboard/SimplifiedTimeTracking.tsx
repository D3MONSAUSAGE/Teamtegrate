import React, { useState } from 'react';
import { WeeklyScheduleSummary } from './WeeklyScheduleSummary';
import StreamlinedTimeControls from './StreamlinedTimeControls';
import { EmployeeTimeStatusCard } from '@/components/employee/EmployeeTimeStatusCard';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MobileTimeTrackingWidget from '@/components/mobile/MobileTimeTrackingWidget';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';

export const SimplifiedTimeTracking: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  
  const {
    currentSession,
    weeklyEntries,
    isLoading: timeTrackingLoading,
    lastError,
    clockIn,
    clockOut,
    startBreak,
    endBreak
  } = useEmployeeTimeTracking();

  // Format elapsed time for mobile widget
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert session data to mobile widget format
  const elapsedTime = currentSession?.elapsedSeconds ? formatElapsedTime(currentSession.elapsedSeconds) : '00:00:00';
  const breakElapsedTime = currentSession?.breakElapsedSeconds ? formatElapsedTime(currentSession.breakElapsedSeconds) : '00:00:00';
  
  const currentEntry = {
    isClocked: currentSession?.isActive || false,
    clock_in: currentSession?.clockInTime,
    id: currentSession?.sessionId
  };

  const breakState = {
    isOnBreak: currentSession?.isOnBreak || false,
    breakType: currentSession?.breakType,
  };

  // Get recent time entries for status display
  const recentEntries = weeklyEntries
    .filter(entry => entry.clock_out) // Only completed entries
    .slice(0, 10)
    .map(entry => ({
      id: entry.id,
      clock_in: entry.clock_in,
      clock_out: entry.clock_out!,
      duration_minutes: entry.duration_minutes || 0,
      notes: entry.notes,
      approval_status: (entry.approval_status || 'pending') as 'pending' | 'approved' | 'rejected',
      approved_by: entry.approved_by,
      approved_at: entry.approved_at,
      approval_notes: entry.approval_notes
    }));

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
          lastSyncTime={currentSession?.clockInTime ? new Date(currentSession.clockInTime) : undefined}
          isSyncing={timeTrackingLoading}
        />
      ) : (
        <StreamlinedTimeControls />
      )}

      {/* Employee Time Status Display */}
      <EmployeeTimeStatusCard 
        entries={recentEntries}
        isLoading={timeTrackingLoading}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        onRequestCorrection={(entryId) => {
          // TODO: Implement correction request functionality
        }}
      />
    </div>
  );
};