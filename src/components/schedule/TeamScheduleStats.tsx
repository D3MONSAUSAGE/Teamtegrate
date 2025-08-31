import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Calendar, TrendingUp } from 'lucide-react';
import { EmployeeSchedule } from '@/hooks/useScheduleManagement';

interface TeamScheduleStatsProps {
  schedules: EmployeeSchedule[];
  teamName?: string;
  loading?: boolean;
}

export const TeamScheduleStats: React.FC<TeamScheduleStatsProps> = ({
  schedules,
  teamName,
  loading = false,
}) => {
  const getTeamStats = () => {
    const thisWeek = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduled_date);
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      return scheduleDate >= weekStart && scheduleDate <= new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    });

    const uniqueEmployees = new Set(schedules.map(s => s.employee_id));
    const totalHours = thisWeek.reduce((sum, schedule) => {
      const start = new Date(schedule.scheduled_start_time);
      const end = new Date(schedule.scheduled_end_time);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    const completedShifts = thisWeek.filter(s => s.status === 'completed').length;
    const scheduledShifts = thisWeek.filter(s => s.status === 'scheduled').length;

    return {
      totalEmployees: uniqueEmployees.size,
      thisWeekShifts: thisWeek.length,
      totalHours: Math.round(totalHours),
      completedShifts,
      scheduledShifts,
      completionRate: thisWeek.length > 0 ? Math.round((completedShifts / thisWeek.length) * 100) : 0
    };
  };

  const stats = getTeamStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted rounded mb-1"></div>
              <div className="h-3 w-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teamName && (
        <div className="text-sm text-muted-foreground">
          Statistics for <span className="font-medium text-foreground">{teamName}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Active members
            </p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Shift completion rate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};