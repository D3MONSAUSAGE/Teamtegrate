
import React from 'react';
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage';
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
  
  // Check if user is a manager/admin for schedule management access
  const isManager = user?.role && ['manager', 'admin', 'superadmin'].includes(user.role);

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

