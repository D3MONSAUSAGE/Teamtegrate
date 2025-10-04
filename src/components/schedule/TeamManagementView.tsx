import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Users, 
  Clock, 
  BarChart3, 
  CheckCircle,
  Filter,
  Search,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
interface Team {
  id: string;
  name: string;
  description?: string;
  manager_name?: string;
  member_count: number;
  is_active: boolean;
}

import { useTeamAccess } from '@/hooks/useTeamAccess';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { InlineTeamSelector } from '@/components/teams';
import { TimeEntryApprovalList } from '@/components/time-approvals/TimeEntryApprovalList';
import { TeamWeeklyScheduleView } from './TeamWeeklyScheduleView';
import { WeeklyScheduleCreator } from './WeeklyScheduleCreator';
import { Input } from '@/components/ui/input';
import ModernMetricCard from './modern/ModernMetricCard';
import { ScannerStationManagement } from '@/components/attendance/ScannerStationManagement';
import { ManagerQRGenerator } from '@/components/attendance/ManagerQRGenerator';
import { Monitor, QrCode } from 'lucide-react';
import { TeamSettingsDialog } from './TeamSettingsDialog';

export const TeamManagementView: React.FC = () => {
  const { user, hasRoleAccess } = useAuth();
  const { teams, isLoading: teamsLoading } = useTeamAccess();
  const {
    employeeSchedules, 
    selectedTeamId, 
    setSelectedTeamId, 
    fetchEmployeeSchedules,
    isLoading 
  } = useScheduleManagement();
  const [activeSubTab, setActiveSubTab] = useState('create-schedule');
  const [searchQuery, setSearchQuery] = useState('');
  const [showManagerQR, setShowManagerQR] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Calculate team-specific metrics
  const getTeamMetrics = () => {
    const filteredSchedules = selectedTeamId 
      ? employeeSchedules.filter(s => s.team_id === selectedTeamId)
      : employeeSchedules;

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    
    const thisWeekSchedules = filteredSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduled_date);
      return scheduleDate >= thisWeekStart && scheduleDate <= new Date(thisWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    });

    const uniqueEmployees = new Set(filteredSchedules.map(s => s.employee_id));
    const totalHours = thisWeekSchedules.reduce((sum, schedule) => {
      const start = new Date(schedule.scheduled_start_time);
      const end = new Date(schedule.scheduled_end_time);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    const completedShifts = thisWeekSchedules.filter(s => s.status === 'completed').length;
    const missedShifts = thisWeekSchedules.filter(s => s.status === 'missed').length;
    const coverage = thisWeekSchedules.length > 0 ? Math.round((completedShifts / thisWeekSchedules.length) * 100) : 100;

    return {
      totalShifts: thisWeekSchedules.length,
      activeMembers: uniqueEmployees.size,
      totalHours: Math.round(totalHours),
      coverage,
      completedShifts,
      missedShifts
    };
  };

  const teamMetrics = getTeamMetrics();
  const selectedTeamName = selectedTeamId && teams.find(t => t.id === selectedTeamId)?.name;

  // Load schedules when team changes
  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    fetchEmployeeSchedules(
      startOfWeek.toISOString().split('T')[0],
      endOfWeek.toISOString().split('T')[0],
      false,
      selectedTeamId || undefined
    );
  }, [selectedTeamId, fetchEmployeeSchedules]);

  return (
    <div className="space-y-6">
      {/* Team Selection Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                {selectedTeamName ? `Managing ${selectedTeamName}` : 'Select a team to manage schedules and approvals'}
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-3">
              <div className="w-full md:w-auto flex items-center justify-center">
                <div className="w-full md:w-auto">
                  <InlineTeamSelector
                    selectedTeamId={selectedTeamId}
                    onTeamChange={setSelectedTeamId}
                    disabled={teamsLoading}
                    showAllOption={hasRoleAccess('admin')}
                  />
                </div>
              </div>
              {selectedTeamId && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSettingsDialogOpen(true)}
                  className="shrink-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Management Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <ScrollableTabsList className="md:grid md:grid-cols-5">
          <ScrollableTabsTrigger 
            isActive={activeSubTab === 'create-schedule'}
            onClick={() => setActiveSubTab('create-schedule')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Create Schedule
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger 
            isActive={activeSubTab === 'schedules'}
            onClick={() => setActiveSubTab('schedules')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Team Schedule
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger 
            isActive={activeSubTab === 'approvals'}
            onClick={() => setActiveSubTab('approvals')}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Approvals
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger 
            isActive={activeSubTab === 'scanners'}
            onClick={() => setActiveSubTab('scanners')}
            className="flex items-center gap-2"
          >
            <Monitor className="h-4 w-4" />
            Scanners
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger 
            isActive={activeSubTab === 'analytics'}
            onClick={() => setActiveSubTab('analytics')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </ScrollableTabsTrigger>
        </ScrollableTabsList>

        <TabsContent value="create-schedule" className="space-y-6">
          <WeeklyScheduleCreator selectedTeamId={selectedTeamId} />
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <TeamWeeklyScheduleView selectedTeamId={selectedTeamId} />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <TimeEntryApprovalList selectedTeamId={selectedTeamId} />
        </TabsContent>

        <TabsContent value="scanners" className="space-y-6">
          {/* Quick Action: Generate QR for Employee */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Help employees with attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowManagerQR(true)}
                size="lg"
                className="w-full"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Generate QR for Employee
              </Button>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Help employees without phones clock in/out
              </p>
            </CardContent>
          </Card>

          <ScannerStationManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Analytics</CardTitle>
              <CardDescription>
                Detailed analytics and insights for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">Analytics Coming Soon</p>
                <p className="text-sm text-muted-foreground/70 text-center max-w-sm">
                  Advanced team analytics and reporting features will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manager QR Generator Dialog */}
      <ManagerQRGenerator 
        open={showManagerQR}
        onOpenChange={setShowManagerQR}
      />

      {/* Team Settings Dialog */}
      <TeamSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        team={teams.find(t => t.id === selectedTeamId) as any || null}
        organizationRequiresSchedule={false}
      />
    </div>
  );
};