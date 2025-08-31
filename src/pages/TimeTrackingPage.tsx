import React, { useState, useEffect } from 'react';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useTeamUsers } from '@/hooks/useTeamUsers';
import { useTeamTimeStats } from '@/hooks/useTeamTimeStats';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/contexts/AuthContext';
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Modern components
import ModernTimeTrackingHeader from '@/components/schedule/modern/ModernTimeTrackingHeader';
import { TeamTotalsView } from '@/components/time-management/TeamTotalsView';

// Existing components
import MobileTimeTrackingWidget from '@/components/mobile/MobileTimeTrackingWidget';
import EmployeeTimeTracking from '@/components/dashboard/EmployeeTimeTracking';
import PastTimeEntriesManager from '@/components/time-entries/PastTimeEntriesManager';
import { TimeCorrectionManager } from '@/components/time-entries/TimeCorrectionManager';
import ScheduleManagerDashboard from '@/components/schedule/ScheduleManagerDashboard';
import ScheduleEmployeeDashboard from '@/components/schedule/ScheduleEmployeeDashboard';
import { TeamMembersGridView } from '@/components/time-management/TeamMembersGridView';

const TimeTrackingPage = () => {
  const { user, hasRoleAccess } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'individual' | 'team-totals'>('individual');
  const [activeTab, setActiveTab] = useState('schedule'); // Default to schedule first
  const [weekDate, setWeekDate] = useState(new Date());

  // Progressive loading management
  const { 
    loadingPhase, 
    state: loadingState, 
    actions: { markScheduleReady, markTimeTrackingReady, markTeamDataReady },
    shouldLoadTimeTracking, 
    shouldLoadTeamData 
  } = useProgressiveLoading();

  // Always call all hooks (React Rules of Hooks requirement)
  const { employeeSchedules, isLoading: scheduleLoading } = useScheduleManagement();
  
  const {
    currentSession,
    dailySummary,
    weeklyEntries,
    isLoading: timeTrackingLoading,
    lastError,
    clockIn,
    clockOut,
    startBreak,
    endBreak
  } = useEmployeeTimeTracking();

  const { teams } = useTeamManagement();
  const { users, isLoading: usersLoading } = useTeamUsers(selectedTeamId);
  const { teamStats, isLoading: statsLoading } = useTeamTimeStats(weekDate, selectedTeamId);

  // Mark loading phases as complete
  useEffect(() => {
    if (!scheduleLoading && !loadingState.scheduleReady) {
      markScheduleReady();
    }
  }, [scheduleLoading, loadingState.scheduleReady, markScheduleReady]);

  useEffect(() => {
    if (!timeTrackingLoading && !loadingState.timeTrackingReady && loadingState.scheduleReady) {
      markTimeTrackingReady();
    }
  }, [timeTrackingLoading, loadingState.timeTrackingReady, loadingState.scheduleReady, markTimeTrackingReady]);

  useEffect(() => {
    if (!usersLoading && !statsLoading && !loadingState.teamDataReady && loadingState.scheduleReady) {
      markTeamDataReady();
    }
  }, [usersLoading, statsLoading, loadingState.teamDataReady, loadingState.scheduleReady, markTeamDataReady]);

  // Responsive detection
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  // Role-based access control
  const isAdmin = hasRoleAccess('admin');
  const isManager = hasRoleAccess('manager');
  const canManageTeams = isAdmin || isManager;

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

  // Get selected team/user names for header
  const selectedTeamName = selectedTeamId ? teams.find(t => t.id === selectedTeamId)?.name : null;
  const selectedUserName = selectedUserId ? users.find(u => u.id === selectedUserId)?.name : null;

  // Determine available tabs - Schedule and Time Entries main categories
  const getAvailableTabs = () => {
    const baseTabs = [
      { value: 'schedule', label: 'Schedule', icon: '📅', ready: loadingState.scheduleReady }
    ];

    // Time Entries is available for everyone
    baseTabs.push({ 
      value: 'time-entries', 
      label: 'Time Entries', 
      icon: '⏰', 
      ready: loadingState.timeTrackingReady 
    });

    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="space-y-4 p-6 max-w-7xl mx-auto">
      {/* Modern Header with Integrated Tabs */}
      <ModernTimeTrackingHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        availableTabs={availableTabs}
        canManageTeams={canManageTeams}
        teams={teams}
        users={users}
        selectedTeamId={selectedTeamId}
        selectedUserId={selectedUserId}
        onTeamChange={setSelectedTeamId}
        onUserChange={setSelectedUserId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isLoading={usersLoading || statsLoading}
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          {!loadingState.scheduleReady ? (
            <Card className="p-6">
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading schedule...</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Personal Schedule for all users */}
              <ScheduleEmployeeDashboard />
              
              {/* Manager Schedule Management */}
              {canManageTeams && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Schedule Management</h3>
                  <ScheduleManagerDashboard />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Time Entries Tab */}
        <TabsContent value="time-entries" className="space-y-4">
          {!loadingState.timeTrackingReady ? (
            <Card className="p-6">
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading time entries...</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Personal Time Tracking for all users */}
              {user?.role === 'user' || !selectedTeamId ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Time Tracking</h3>
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
                    <EmployeeTimeTracking />
                  )}
                </div>
              ) : selectedUserId ? (
                <Card className="p-6">
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold mb-2">Individual Employee Tracking</h3>
                    <p className="text-muted-foreground mb-4">
                      Viewing time tracking data for {selectedUserName}
                    </p>
                    <Button variant="outline" onClick={() => setSelectedUserId(null)}>
                      Back to Team View
                    </Button>
                  </div>
                </Card>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Team Time Tracking</h3>
                  <TeamMembersGridView
                    teamMembers={users}
                    teamStats={teamStats}
                    isLoading={usersLoading || statsLoading}
                    onSelectMember={setSelectedUserId}
                    weekDate={weekDate}
                  />
                </div>
              )}

              {/* Team Overview for managers */}
              {canManageTeams && viewMode === 'team-totals' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Team Overview</h3>
                  <TeamTotalsView
                    teamStats={teamStats}
                    selectedTeamId={selectedTeamId}
                    weekDate={weekDate}
                    isLoading={statsLoading}
                  />
                </div>
              )}

              {/* Correction Requests */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Correction Requests</h3>
                <TimeCorrectionManager />
              </div>

              {/* Past Time Entries Management for managers */}
              {canManageTeams && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Time Entries Management</h3>
                  <PastTimeEntriesManager />
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeTrackingPage;
