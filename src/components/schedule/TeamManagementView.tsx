import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Users, 
  Clock, 
  BarChart3, 
  CheckCircle,
  Filter,
  Search
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

import { useTeams } from '@/hooks/useTeams';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { TeamScheduleSelector } from './TeamScheduleSelector';
import { TimeEntryApprovalList } from '@/components/time-approvals/TimeEntryApprovalList';
import { EmployeeScheduleManager } from './EmployeeScheduleManager';
import { Input } from '@/components/ui/input';
import ModernMetricCard from './modern/ModernMetricCard';

export const TeamManagementView: React.FC = () => {
  const { user, hasRoleAccess } = useAuth();
  const { teams, isLoading: teamsLoading } = useTeams();
  const { 
    employeeSchedules, 
    selectedTeamId, 
    setSelectedTeamId, 
    fetchEmployeeSchedules,
    isLoading 
  } = useScheduleManagement();
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                {selectedTeamName ? `Managing ${selectedTeamName}` : 'Select a team to manage schedules and approvals'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <TeamScheduleSelector
                teams={teams as any}
                selectedTeamId={selectedTeamId}
                onTeamChange={setSelectedTeamId}
                disabled={teamsLoading}
                showAllOption={hasRoleAccess('admin')}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Team Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ModernMetricCard
          title="Total Shifts"
          value={teamMetrics.totalShifts}
          change={{ value: '+5', trend: 'up' }}
          icon={Calendar}
          progress={75}
          description="This week"
          gradient="from-primary/10 to-primary/5"
        />
        
        <ModernMetricCard
          title="Active Members"
          value={teamMetrics.activeMembers}
          change={{ value: '+2', trend: 'up' }}
          icon={Users}
          progress={85}
          description="Team members"
          gradient="from-accent/10 to-accent/5"
        />
        
        <ModernMetricCard
          title="Total Hours"
          value={`${teamMetrics.totalHours}h`}
          change={{ value: '+12h', trend: 'up' }}
          icon={Clock}
          progress={90}
          description="Scheduled"
          gradient="from-success/10 to-success/5"
        />
        
        <ModernMetricCard
          title="Coverage"
          value={`${teamMetrics.coverage}%`}
          change={{ value: '+5%', trend: 'up' }}
          icon={BarChart3}
          progress={teamMetrics.coverage}
          description="Shift coverage"
          gradient="from-warning/10 to-warning/5"
        />
      </div>

      {/* Management Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Schedule Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Overview</CardTitle>
                <CardDescription>
                  Team schedule summary for this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Completed Shifts</span>
                    <span className="text-sm text-green-600 font-semibold">{teamMetrics.completedShifts}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Missed Shifts</span>
                    <span className="text-sm text-red-600 font-semibold">{teamMetrics.missedShifts}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Coverage Rate</span>
                    <span className="text-sm text-primary font-semibold">{teamMetrics.coverage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Create New Schedule
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team Members
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Review Time Entries
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <EmployeeScheduleManager />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <TimeEntryApprovalList selectedTeamId={selectedTeamId} />
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
    </div>
  );
};