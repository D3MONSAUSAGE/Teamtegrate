import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { differenceInHours, parseISO } from 'date-fns';

export interface TeamMemberSchedule {
  id: string;
  name: string;
  email: string;
  schedules: {
    id: string;
    scheduled_date: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    status: string;
    duration_hours: number;
    notes?: string;
    area?: string;
    actual_hours?: number;
  }[];
  totalHours: number;
  overtimeHours: number;
  actualHours: number;
}

export interface TeamScheduleMetrics {
  projectedHours: number;
  actualHours: number;
  hoursVariance: number;
  utilizationRate: number;
  activeMembers: number;
  averageHoursPerMember: number;
  totalOvertimeHours: number;
}

export const useTeamWeeklySchedules = (
  teamId: string | null,
  startDate: string,
  endDate: string
) => {
  const { user } = useAuth();
  const [teamSchedules, setTeamSchedules] = useState<TeamMemberSchedule[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamScheduleMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamSchedules = useCallback(async () => {
    if (!user || !teamId || teamId === 'all') {
      setTeamSchedules([]);
      setTeamMetrics(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First, fetch team members for the selected team
      const { data: teamMembers, error: teamMembersError } = await supabase
        .from('team_memberships')
        .select('user_id')
        .eq('team_id', teamId);

      if (teamMembersError) throw teamMembersError;

      if (!teamMembers || teamMembers.length === 0) {
        setTeamSchedules([]);
        setTeamMetrics(null);
        setIsLoading(false);
        return;
      }

      const memberIds = teamMembers.map(tm => tm.user_id);

      // Fetch schedules for team members, regardless of schedule's team_id
      const { data: schedules, error: schedulesError } = await supabase
        .from('employee_schedules')
        .select(`
          id,
          employee_id,
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          status,
          notes,
          area,
          users!employee_id (
            id,
            name,
            email
          )
        `)
        .in('employee_id', memberIds)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date');

      if (schedulesError) throw schedulesError;

      // Fetch actual time entries for team members
      const { data: timeEntries, error: timeEntriesError } = await supabase
        .from('time_entries')
        .select('user_id, duration_minutes, clock_in')
        .in('user_id', memberIds)
        .gte('clock_in', startDate)
        .lte('clock_in', endDate)
        .not('clock_out', 'is', null);

      if (timeEntriesError) throw timeEntriesError;

      // Calculate actual hours per employee from time entries
      const employeeActualHours = new Map<string, number>();
      (timeEntries || []).forEach((entry) => {
        const hours = (entry.duration_minutes || 0) / 60;
        const currentHours = employeeActualHours.get(entry.user_id) || 0;
        employeeActualHours.set(entry.user_id, currentHours + hours);
      });

      // Process schedules by employee
      const employeeScheduleMap = new Map<string, TeamMemberSchedule>();

      (schedules || []).forEach((schedule) => {
        const employeeId = schedule.employee_id;
        const user = schedule.users;
        
        if (!user) return;

        // Calculate duration
        const startTime = parseISO(`${schedule.scheduled_date}T${schedule.scheduled_start_time}`);
        const endTime = parseISO(`${schedule.scheduled_date}T${schedule.scheduled_end_time}`);
        const duration = differenceInHours(endTime, startTime);

        const scheduleItem = {
          id: schedule.id,
          scheduled_date: schedule.scheduled_date,
          scheduled_start_time: schedule.scheduled_start_time,
          scheduled_end_time: schedule.scheduled_end_time,
          status: schedule.status,
          duration_hours: duration,
          notes: schedule.notes,
          area: schedule.area,
        };

        if (!employeeScheduleMap.has(employeeId)) {
          employeeScheduleMap.set(employeeId, {
            id: employeeId,
            name: user.name || user.email,
            email: user.email,
            schedules: [],
            totalHours: 0,
            overtimeHours: 0,
            actualHours: employeeActualHours.get(employeeId) || 0,
          });
        }

        const employee = employeeScheduleMap.get(employeeId)!;
        employee.schedules.push(scheduleItem);
        employee.totalHours += duration;
        
        // Calculate overtime (over 40 hours per week)
        if (employee.totalHours > 40) {
          employee.overtimeHours = employee.totalHours - 40;
        }
      });

      const teamSchedulesList = Array.from(employeeScheduleMap.values());
      setTeamSchedules(teamSchedulesList);

      // Calculate team metrics
      const projectedHours = teamSchedulesList.reduce((sum, member) => sum + member.totalHours, 0);
      const actualHours = teamSchedulesList.reduce((sum, member) => sum + member.actualHours, 0);
      const totalOvertimeHours = teamSchedulesList.reduce((sum, member) => sum + member.overtimeHours, 0);
      const activeMembers = teamSchedulesList.length;
      
      // Calculate hours variance and utilization rate
      const hoursVariance = actualHours - projectedHours;
      const utilizationRate = projectedHours > 0 ? Math.round((actualHours / projectedHours) * 100) : 0;

      setTeamMetrics({
        projectedHours,
        actualHours,
        hoursVariance,
        utilizationRate,
        activeMembers,
        averageHoursPerMember: activeMembers > 0 ? Math.round(projectedHours / activeMembers) : 0,
        totalOvertimeHours,
      });

    } catch (err) {
      console.error('Error fetching team schedules:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch team schedules';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, teamId, startDate, endDate]);

  const exportSchedule = useCallback(async () => {
    if (!teamSchedules.length) {
      toast.warning('No schedule data to export');
      return;
    }

    try {
      // Create CSV content
      const headers = ['Employee', 'Email', 'Date', 'Start Time', 'End Time', 'Duration (hours)', 'Status', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...teamSchedules.flatMap(member =>
          member.schedules.map(schedule =>
            [
              `"${member.name}"`,
              `"${member.email}"`,
              schedule.scheduled_date,
              schedule.scheduled_start_time,
              schedule.scheduled_end_time,
              schedule.duration_hours,
              schedule.status,
              `"${schedule.notes || ''}"`
            ].join(',')
          )
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `team-schedule-${startDate}-to-${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Schedule exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export schedule');
    }
  }, [teamSchedules, startDate, endDate]);

  useEffect(() => {
    fetchTeamSchedules();
  }, [fetchTeamSchedules]);

  return {
    teamSchedules,
    teamMetrics,
    isLoading,
    error,
    exportSchedule,
    refetch: fetchTeamSchedules,
  };
};