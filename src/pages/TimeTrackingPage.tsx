
import React, { useState, useEffect } from 'react';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useTeamUsers } from '@/hooks/useTeamUsers';
import { useTeamTimeStats } from '@/hooks/useTeamTimeStats';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/contexts/AuthContext';
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Role-based imports
import { RoleBasedTimeHeader } from '@/components/time-management/RoleBasedTimeHeader';
import { TeamFirstSelector } from '@/components/time-management/TeamFirstSelector';
import { TeamTotalsView } from '@/components/time-management/TeamTotalsView';

// Existing components
import MobileTimeTrackingWidget from '@/components/mobile/MobileTimeTrackingWidget';
import EmployeeTimeTracking from '@/components/dashboard/EmployeeTimeTracking';
import PastTimeEntriesManager from '@/components/time-entries/PastTimeEntriesManager';
import ScheduleManagerDashboard from '@/components/schedule/ScheduleManagerDashboard';
import ScheduleEmployeeDashboard from '@/components/schedule/ScheduleEmployeeDashboard';
import { TeamMembersGridView } from '@/components/time-management/TeamMembersGridView';

const TimeTrackingPage = () => {
  const { user, hasRoleAccess } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'individual' | 'team-totals'>('individual');
  const [activeTab, setActiveTab] = useState('my-schedule'); // Default to schedule first
  const [weekDate, setWeekDate] = useState(new Date());

  // Progressive loading management
  const { 
    loadingPhase, 
    state: loadingState, 
    actions: { markScheduleReady, markTimeTrackingReady, markTeamDataReady },
    shouldLoadTimeTracking, 
    shouldLoadTeamData 
  } = useProgressiveLoading();

  // Priority loading: Schedule first (always loads)
  const { employeeSchedules, isLoading: scheduleLoading } = useScheduleManagement();
  
  // Secondary loading: Time tracking (loads after schedule)
  const timeTrackingData = shouldLoadTimeTracking ? useEmployeeTimeTracking() : {
    currentSession: null,
    dailySummary: null,
    weeklyEntries: [],
    isLoading: false,
    lastError: null,
    clockIn: () => {},
    clockOut: () => {},
    startBreak: () => {},
    endBreak: () => {}
  };

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
  } = timeTrackingData;

  // Secondary loading: Team data (loads after schedule)
  const { teams } = shouldLoadTeamData ? useTeamManagement() : { teams: [] };
  const { users, isLoading: usersLoading } = shouldLoadTeamData ? useTeamUsers(selectedTeamId) : { users: [], isLoading: false };
  const { teamStats, isLoading: statsLoading } = shouldLoadTeamData ? useTeamTimeStats(weekDate, selectedTeamId) : { teamStats: null, isLoading: false };

  // Mark loading phases as complete
  useEffect(() => {
    if (!scheduleLoading && !loadingState.scheduleReady) {
      markScheduleReady();
    }
  }, [scheduleLoading, loadingState.scheduleReady, markScheduleReady]);

  useEffect(() => {
    if (shouldLoadTimeTracking && !timeTrackingLoading && !loadingState.timeTrackingReady) {
      markTimeTrackingReady();
    }
  }, [shouldLoadTimeTracking, timeTrackingLoading, loadingState.timeTrackingReady, markTimeTrackingReady]);

  useEffect(() => {
    if (shouldLoadTeamData && !usersLoading && !statsLoading && !loadingState.teamDataReady) {
      markTeamDataReady();
    }
  }, [shouldLoadTeamData, usersLoading, statsLoading, loadingState.teamDataReady, markTeamDataReady]);

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

  // Quick action handler
  const handleQuickAction = (action: 'export' | 'settings' | 'reports') => {
    // TODO: Implement quick actions
    console.log(`Quick action: ${action}`);
  };

  // Determine available tabs based on role - Schedule first priority
  const getAvailableTabs = () => {
    const baseTabs = [
      { value: 'my-schedule', label: 'My Schedule', icon: '📅', ready: loadingState.scheduleReady }
    ];

    if (user?.role === 'user') {
      baseTabs.push({ 
        value: 'time-tracking', 
        label: 'Time Tracking', 
        icon: '⏰', 
        ready: loadingState.timeTrackingReady 
      });
      return baseTabs;
    }

    baseTabs.push({ 
      value: 'time-tracking', 
      label: 'Time Tracking', 
      icon: '⏰', 
      ready: loadingState.timeTrackingReady 
    });

    if (canManageTeams) {
      baseTabs.push(
        { value: 'team-overview', label: 'Team Overview', icon: '👥', ready: loadingState.teamDataReady },
        { value: 'schedule-management', label: 'Schedule Management', icon: '📋', ready: loadingState.scheduleReady },
        { value: 'time-entries', label: 'Time Entries', icon: '📝', ready: loadingState.teamDataReady }
      );
    }

    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Role-Based Header */}
      <RoleBasedTimeHeader
        userRole={user?.role || 'user'}
        userName={user?.name || 'User'}
        selectedTeamName={selectedTeamName || undefined}
        selectedUserName={selectedUserName || undefined}
        viewMode={activeTab as any}
        hasComplianceIssues={!!lastError}
        onQuickAction={canManageTeams ? handleQuickAction : undefined}
      />

      {/* Team-First Navigation (Admin/Manager Only) */}
      {canManageTeams && (
        <TeamFirstSelector
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
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
          {availableTabs.map(tab => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value} 
              className="flex items-center gap-2"
              disabled={!tab.ready}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {!tab.ready && <span className="animate-pulse">⌛</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* My Schedule - Priority Tab */}
        <TabsContent value="my-schedule" className="space-y-4">
          {loadingState.scheduleReady ? (
            <ScheduleEmployeeDashboard />
          ) : (
            <Card className="p-6">
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your schedule...</p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Personal Time Tracking */}
        <TabsContent value="time-tracking" className="space-y-4">
          {user?.role === 'user' || !selectedTeamId ? (
            // Personal time tracking interface
            <div className="space-y-4">
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
            // Individual employee view
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
            // Team members grid view (no specific employee selected)
            <TeamMembersGridView
              teamMembers={users}
              teamStats={teamStats}
              isLoading={usersLoading || statsLoading}
              onSelectMember={setSelectedUserId}
              weekDate={weekDate}
            />
          )}
        </TabsContent>

        {/* Team Overview (Managers+ only) */}
        {canManageTeams && (
          <TabsContent value="team-overview" className="space-y-4">
            {viewMode === 'team-totals' ? (
              <TeamTotalsView
                teamStats={teamStats}
                selectedTeamId={selectedTeamId}
                weekDate={weekDate}
                isLoading={statsLoading}
              />
            ) : (
              <Card className="p-6">
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">Individual Team Member View</h3>
                  <p className="text-muted-foreground mb-4">
                    Switch to "Team Totals" view mode above to see aggregate team statistics
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setViewMode('team-totals')}
                  >
                    Switch to Team Totals
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        )}


        {/* Schedule Management (Managers+ only) */}
        {canManageTeams && (
          <TabsContent value="schedule-management" className="space-y-4">
            <ScheduleManagerDashboard />
          </TabsContent>
        )}

        {/* Time Entries Management (Managers+ only) */}
        {canManageTeams && (
          <TabsContent value="time-entries" className="space-y-4">
            <PastTimeEntriesManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TimeTrackingPage;

