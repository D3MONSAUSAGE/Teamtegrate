
import React, { useState } from 'react';
import { useEmployeeTimeTracking } from '@/hooks/useEmployeeTimeTracking';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useTeamUsers } from '@/hooks/useTeamUsers';
import { useTeamTimeStats } from '@/hooks/useTeamTimeStats';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/contexts/AuthContext';
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

const TimeTrackingPage = () => {
  const { user, hasRoleAccess } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'individual' | 'team-totals'>('individual');
  const [activeTab, setActiveTab] = useState('time-tracking');
  const [weekDate, setWeekDate] = useState(new Date());

  // Existing hooks
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

  // New hooks for enhanced functionality
  const { teams } = useTeamManagement();
  const { users, isLoading: usersLoading } = useTeamUsers(selectedTeamId);
  const { teamStats, isLoading: statsLoading } = useTeamTimeStats(weekDate, selectedTeamId);

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

  // Determine available tabs based on role
  const getAvailableTabs = () => {
    const baseTabs = [
      { value: 'time-tracking', label: 'Time Tracking', icon: '⏰' }
    ];

    if (user?.role === 'user') {
      baseTabs.push({ value: 'my-schedule', label: 'My Schedule', icon: '📅' });
      return baseTabs;
    }

    if (canManageTeams) {
      baseTabs.push(
        { value: 'team-overview', label: 'Team Overview', icon: '👥' },
        { value: 'schedule-management', label: 'Schedule Management', icon: '📋' },
        { value: 'time-entries', label: 'Time Entries', icon: '📝' }
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
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              <span>{tab.icon}</span>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

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
          ) : (
            // Team/Admin view with selectors
            <Card className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Team Time Tracking</h3>
                <p className="text-muted-foreground mb-4">
                  {viewMode === 'team-totals' 
                    ? 'Select a team above to view aggregate time statistics'
                    : 'Select a team and employee above to view individual time tracking data'
                  }
                </p>
                {!selectedTeamId && (
                  <p className="text-sm text-amber-600">
                    Use the Team-First Navigation above to get started
                  </p>
                )}
              </div>
            </Card>
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

        {/* My Schedule (All users) */}
        <TabsContent value="my-schedule" className="space-y-4">
          <ScheduleEmployeeDashboard />
        </TabsContent>

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

