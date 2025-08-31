import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Clock, Settings, Plus } from 'lucide-react';
import { ScheduleCalendarView } from './ScheduleCalendarView';
import { EmployeeScheduleManager } from './EmployeeScheduleManager';
import { ScheduleTemplateManager } from './ScheduleTemplateManager';
import { TeamScheduleSelector } from './TeamScheduleSelector';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { useAuth } from '@/contexts/AuthContext';

const ScheduleManagerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const { user } = useAuth();
  const { 
    employeeSchedules, 
    selectedTeamId, 
    setSelectedTeamId, 
    teams, 
    fetchEmployeeSchedules,
    isLoading 
  } = useScheduleManagement();

  // Calculate stats based on current data and team filter
  const getStats = () => {
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

    return {
      thisWeekShifts: thisWeekSchedules.length,
      activeEmployees: uniqueEmployees.size,
      totalHours: Math.round(totalHours),
      coverage: thisWeekSchedules.length > 0 ? Math.min(100, Math.round((thisWeekSchedules.length / (7 * 3)) * 100)) : 0
    };
  };

  const stats = getStats();

  // Load current week data on mount and when team changes
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

  const showTeamSelector = user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'manager') && teams.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
          <p className="text-muted-foreground">
            Manage employee schedules, shifts, and availability
            {selectedTeamId && teams.find(t => t.id === selectedTeamId) && (
              <span className="ml-2 text-primary">
                • {teams.find(t => t.id === selectedTeamId)?.name}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showTeamSelector && (
            <TeamScheduleSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              onTeamChange={setSelectedTeamId}
              disabled={isLoading}
            />
          )}
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Quick Schedule
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeekShifts}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled shifts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Active employees
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coverage}%</div>
            <p className="text-xs text-muted-foreground">
              Schedule coverage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Schedule Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Schedule Calendar</TabsTrigger>
          <TabsTrigger value="employees">Assign Employees</TabsTrigger>
          <TabsTrigger value="schedules">Schedule Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <ScheduleCalendarView />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <EmployeeScheduleManager />
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <ScheduleTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleManagerDashboard;