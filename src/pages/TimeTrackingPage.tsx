
import React from 'react';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MobileTimeTrackingWidget from '@/components/mobile/MobileTimeTrackingWidget';
import EmployeeTimeTracking from '@/components/dashboard/EmployeeTimeTracking';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PastTimeEntriesManager from '@/components/time-entries/PastTimeEntriesManager';
import ScheduleManagerDashboard from '@/components/schedule/ScheduleManagerDashboard';
import ScheduleEmployeeDashboard from '@/components/schedule/ScheduleEmployeeDashboard';
import { useAuth } from '@/contexts/AuthContext';

const TimeTrackingPage = () => {
  const { user } = useAuth();
  const {
    currentSession,
    dailySummary,
    weeklyEntries,
    isLoading,
    lastError,
    clockIn,
    clockOut,
    startBreak,
    endBreak
  } = useEmployeeTimeTracking();

  const [manageOpen, setManageOpen] = React.useState(false);
  // Responsive mobile detection
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  // Check if user is a manager/admin for schedule management access
  const isManager = user?.role && ['manager', 'admin', 'superadmin'].includes(user.role);

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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time Management</h1>
          <p className="text-muted-foreground">
            Professional time tracking with scheduling and compliance monitoring
          </p>
        </div>
        <Button variant="secondary" onClick={() => setManageOpen((v) => !v)}>
          {manageOpen ? 'Close Manage Entries' : 'Manage Entries'}
        </Button>
      </div>
      
      <Tabs defaultValue="time-tracking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="my-schedule">My Schedule</TabsTrigger>
          {isManager && (
            <TabsTrigger value="schedule-management">Schedule Management</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="time-tracking" className="space-y-4">
          {isMobile ? (
            <div className="space-y-6">
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
                isLoading={isLoading}
                isOnline={!lastError}
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
        </TabsContent>

        <TabsContent value="my-schedule" className="space-y-4">
          <ScheduleEmployeeDashboard />
        </TabsContent>

        {isManager && (
          <TabsContent value="schedule-management" className="space-y-4">
            <ScheduleManagerDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TimeTrackingPage;

