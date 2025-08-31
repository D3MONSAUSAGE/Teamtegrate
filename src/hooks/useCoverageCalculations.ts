import { useMemo } from 'react';
import { addDays, format, isSameDay, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ScheduleEntry, TimeEntryData, CoverageData } from './useScheduleCoverageData';

export interface HourCoverage {
  hour: number;
  scheduledEmployees: ScheduleEntry[];
  activeEmployees: TimeEntryData[];
  projectedHours: number;
  actualHours: number;
  coverageLevel: 'none' | 'low' | 'optimal' | 'high';
}

export interface DayCoverage {
  date: Date;
  dayName: string;
  dateString: string;
  hours: HourCoverage[];
  dailyProjected: number;
  dailyActual: number;
  employeeCount: number;
  variance: number;
}

export interface WeekCoverage {
  days: DayCoverage[];
  totalProjected: number;
  totalActual: number;
  totalVariance: number;
  averageCoverage: number;
  uniqueEmployees: number;
}

export const useCoverageCalculations = (coverageData: CoverageData, selectedWeek: Date) => {
  return useMemo(() => {
    const { schedules, timeEntries } = coverageData;
    
    // Generate 7 days for the week (Monday to Sunday)
    const weekStart = new Date(selectedWeek);
    weekStart.setDate(selectedWeek.getDate() - selectedWeek.getDay() + 1); // Start on Monday
    
    const days: DayCoverage[] = Array.from({ length: 7 }, (_, dayIndex) => {
      const currentDay = addDays(weekStart, dayIndex);
      const dayStart = startOfDay(currentDay);
      const dayEnd = endOfDay(currentDay);

      // Filter schedules and time entries for this day
      const daySchedules = schedules.filter(schedule => 
        isSameDay(parseISO(schedule.scheduled_date), currentDay)
      );

      const dayTimeEntries = timeEntries.filter(entry => 
        isSameDay(parseISO(entry.clock_in), currentDay)
      );

      // Calculate hourly coverage (6 AM to 10 PM = 16 hours)
      const hours: HourCoverage[] = Array.from({ length: 16 }, (_, hourIndex) => {
        const hour = hourIndex + 6; // Start from 6 AM
        const hourStart = new Date(currentDay);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(currentDay);
        hourEnd.setHours(hour + 1, 0, 0, 0);

        // Find scheduled employees for this hour
        const scheduledEmployees = daySchedules.filter(schedule => {
          const schedStart = parseISO(schedule.scheduled_start_time);
          const schedEnd = parseISO(schedule.scheduled_end_time);
          return isWithinInterval(hourStart, { start: schedStart, end: schedEnd }) ||
                 isWithinInterval(hourEnd, { start: schedStart, end: schedEnd }) ||
                 (schedStart <= hourStart && schedEnd >= hourEnd);
        });

        // Find active employees for this hour
        const activeEmployees = dayTimeEntries.filter(entry => {
          const clockIn = parseISO(entry.clock_in);
          const clockOut = entry.clock_out ? parseISO(entry.clock_out) : new Date();
          return isWithinInterval(hourStart, { start: clockIn, end: clockOut }) ||
                 isWithinInterval(hourEnd, { start: clockIn, end: clockOut }) ||
                 (clockIn <= hourStart && clockOut >= hourEnd);
        });

        // Calculate projected and actual hours for this hour slot
        const projectedHours = scheduledEmployees.length;
        const actualHours = activeEmployees.length;

        // Determine coverage level
        let coverageLevel: HourCoverage['coverageLevel'] = 'none';
        if (actualHours === 0) coverageLevel = 'none';
        else if (actualHours < projectedHours * 0.7) coverageLevel = 'low';
        else if (actualHours <= projectedHours * 1.2) coverageLevel = 'optimal';
        else coverageLevel = 'high';

        return {
          hour,
          scheduledEmployees,
          activeEmployees,
          projectedHours,
          actualHours,
          coverageLevel
        };
      });

      // Calculate daily totals
      const dailyProjected = daySchedules.reduce((sum, schedule) => {
        const start = parseISO(schedule.scheduled_start_time);
        const end = parseISO(schedule.scheduled_end_time);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert to hours
      }, 0);

      const dailyActual = dayTimeEntries.reduce((sum, entry) => {
        return sum + (entry.duration_minutes || 0) / 60; // Convert to hours
      }, 0);

      const uniqueDayEmployees = new Set([
        ...daySchedules.map(s => s.employee_id),
        ...dayTimeEntries.map(e => e.user_id)
      ]);

      return {
        date: currentDay,
        dayName: format(currentDay, 'EEEE'),
        dateString: format(currentDay, 'MMM d'),
        hours,
        dailyProjected: Math.round(dailyProjected * 10) / 10, // Round to 1 decimal
        dailyActual: Math.round(dailyActual * 10) / 10,
        employeeCount: uniqueDayEmployees.size,
        variance: Math.round((dailyActual - dailyProjected) * 10) / 10
      };
    });

    // Calculate week totals
    const totalProjected = days.reduce((sum, day) => sum + day.dailyProjected, 0);
    const totalActual = days.reduce((sum, day) => sum + day.dailyActual, 0);
    const totalVariance = totalActual - totalProjected;

    // Calculate average coverage (percentage of hours with optimal or high coverage)
    const totalHourSlots = days.reduce((sum, day) => sum + day.hours.length, 0);
    const wellCoveredSlots = days.reduce((sum, day) => 
      sum + day.hours.filter(h => h.coverageLevel === 'optimal' || h.coverageLevel === 'high').length, 0
    );
    const averageCoverage = totalHourSlots > 0 ? (wellCoveredSlots / totalHourSlots) * 100 : 0;

    // Count unique employees across the week
    const uniqueEmployees = new Set([
      ...schedules.map(s => s.employee_id),
      ...timeEntries.map(e => e.user_id)
    ]).size;

    const weekCoverage: WeekCoverage = {
      days,
      totalProjected: Math.round(totalProjected * 10) / 10,
      totalActual: Math.round(totalActual * 10) / 10,
      totalVariance: Math.round(totalVariance * 10) / 10,
      averageCoverage: Math.round(averageCoverage),
      uniqueEmployees
    };

    return weekCoverage;
  }, [coverageData, selectedWeek]);
};