import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, Clock, Calendar, Target } from 'lucide-react';
import { EmployeeSchedule } from '@/hooks/useScheduleManagement';
import { MetricCardsGrid } from '@/components/time-management/MetricCardsGrid';
import { useScheduleMetrics } from '@/hooks/useTimeManagementMetrics';

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
      thisWeekShifts: thisWeek.length,
      activeMembers: uniqueEmployees.size,
      totalMembers: uniqueEmployees.size,
      totalHours: Math.round(totalHours),
      overtimeHours: 0,
      complianceIssues: 0,
      coverage: thisWeek.length > 0 ? Math.round((completedShifts / thisWeek.length) * 100) : 0
    };
  };

  const stats = getTeamStats();
  const scheduleMetrics = useScheduleMetrics(stats);

  if (loading) {
    return (
      <MetricCardsGrid 
        metrics={[]}
        isLoading={true}
      />
    );
  }

  return (
    <div className="space-y-4">
      {teamName && (
        <div className="text-sm text-muted-foreground">
          Statistics for <span className="font-medium text-foreground">{teamName}</span>
        </div>
      )}
      
      <MetricCardsGrid 
        metrics={scheduleMetrics}
        isLoading={false}
      />
    </div>
  );
};