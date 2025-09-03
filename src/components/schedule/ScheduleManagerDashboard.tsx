import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Clock, Settings, Plus, TrendingUp, Target, Activity } from 'lucide-react';

import { EmployeeScheduleManager } from './EmployeeScheduleManager';
import { ScheduleTemplateManager } from './ScheduleTemplateManager';
import { TeamScheduleSelector } from './TeamScheduleSelector';
import { useScheduleManagement } from '@/hooks/useScheduleManagement';
import { useAuth } from '@/contexts/AuthContext';
import ModernScheduleHeader from './modern/ModernScheduleHeader';
import WeeklyScheduleTrend from './modern/WeeklyScheduleTrend';
import ModernScheduleGrid from './modern/ModernScheduleGrid';
import { MetricCardsGrid } from '@/components/time-management/MetricCardsGrid';
import { useScheduleMetrics } from '@/hooks/useTimeManagementMetrics';

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
    // Handle case where employeeSchedules is not loaded yet
    if (!employeeSchedules || employeeSchedules.length === 0) {
      return null;
    }

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

    const stats = {
      thisWeekShifts: thisWeekSchedules.length,
      activeMembers: uniqueEmployees.size,
      totalMembers: uniqueEmployees.size,
      totalHours: Math.round(totalHours),
      overtimeHours: 0,
      complianceIssues: 0,
      coverage: thisWeekSchedules.length > 0 ? Math.min(100, Math.round((thisWeekSchedules.length / (7 * 3)) * 100)) : 0
    };
    
    return stats;
  };

  const statsData = getStats();
  const scheduleMetrics = useScheduleMetrics(statsData);

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
  }, [selectedTeamId]); // Removed fetchEmployeeSchedules from dependencies to prevent infinite loop

  const showTeamSelector = user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'manager') && teams.length > 0;

  // Memoized trend data to prevent unnecessary re-renders
  const trendData = useMemo(() => [
    { day: 'Mon', scheduled: 32, completed: 28, planned: 35 },
    { day: 'Tue', scheduled: 28, completed: 26, planned: 30 },
    { day: 'Wed', scheduled: 35, completed: 32, planned: 38 },
    { day: 'Thu', scheduled: 40, completed: 35, planned: 42 },
    { day: 'Fri', scheduled: 38, completed: 36, planned: 40 },
    { day: 'Sat', scheduled: 25, completed: 22, planned: 28 },
    { day: 'Sun', scheduled: 20, completed: 18, planned: 22 }
  ], []); // Empty dependency array since this is static sample data

  const selectedTeamName = selectedTeamId && teams.find(t => t.id === selectedTeamId)?.name;

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <ModernScheduleHeader
        title="Schedule Management"
        subtitle="Manage employee schedules, shifts, and availability with advanced analytics"
        selectedTeamName={selectedTeamName}
        onNotificationClick={() => console.log('Notifications clicked')}
      >
        {showTeamSelector && (
          <TeamScheduleSelector
            teams={teams}
            selectedTeamId={selectedTeamId}
            onTeamChange={setSelectedTeamId}
            disabled={isLoading}
          />
        )}
        <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          Quick Schedule
        </Button>
      </ModernScheduleHeader>

      {/* Modern Metrics */}
      <MetricCardsGrid 
        metrics={scheduleMetrics}
        isLoading={isLoading}
      />

      {/* Weekly Trend Chart */}
      <WeeklyScheduleTrend data={trendData} />

      {/* Main Schedule Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-background/50 backdrop-blur-sm border border-border/50 shadow-lg">
            <TabsTrigger 
              value="calendar" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10 data-[state=active]:text-primary transition-all duration-300"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Overview
            </TabsTrigger>
            <TabsTrigger 
              value="employees" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10 data-[state=active]:text-primary transition-all duration-300"
            >
              <Users className="h-4 w-4 mr-2" />
              Team Management
            </TabsTrigger>
            <TabsTrigger 
              value="schedules" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10 data-[state=active]:text-primary transition-all duration-300"
            >
              <Settings className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>
          
          <Button 
            variant="outline" 
            size="sm"
            className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
          >
            <Activity className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>

        <TabsContent value="calendar" className="space-y-6 animate-fade-in">
          {/* Modern Schedule Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Recent Schedules</h3>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                View All
              </Button>
            </div>
            <ModernScheduleGrid 
              schedules={employeeSchedules.slice(0, 8)} 
              onScheduleClick={(schedule) => console.log('Schedule clicked:', schedule)} 
            />
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6 animate-fade-in">
          <EmployeeScheduleManager />
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6 animate-fade-in">
          <ScheduleTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleManagerDashboard;