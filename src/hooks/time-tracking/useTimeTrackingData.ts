
import { useState } from 'react';
import { differenceInMinutes } from 'date-fns';
import { TimeEntry, WeeklyChartData } from './timeTrackingUtils';

export function useTimeTrackingData() {
  const [targetWeeklyHours, setTargetWeeklyHours] = useState<number>(() => {
    const stored = localStorage.getItem("targetWeeklyHours");
    return stored ? Number(stored) : 40;
  });
  
  // Calculate weekly chart data
  const calculateWeeklyChartData = (weeklyEntries: TimeEntry[], weekStart: Date): WeeklyChartData[] => {
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    
    return weekDays.map(day => {
      const dateStr = day.toISOString().split("T")[0];
      const dayEntries = weeklyEntries.filter(entry => entry.clock_in.startsWith(dateStr));
      const totalMinutes = dayEntries.reduce((total, entry) => {
        if (entry.duration_minutes) return total + entry.duration_minutes;
        if (entry.clock_out) {
          const diff = differenceInMinutes(
            new Date(entry.clock_out), new Date(entry.clock_in)
          );
          return total + diff;
        }
        return total;
      }, 0);
      return {
        day: day.toLocaleDateString('en-US', { weekday: 'short' }),
        totalHours: +(totalMinutes / 60).toFixed(2)
      };
    });
  };

  // Calculate total time tracked
  const calculateTrackedTime = (weeklyEntries: TimeEntry[]) => {
    const totalTrackedMinutes = weeklyEntries.reduce((total, entry) => {
      if (entry.duration_minutes) {
        return total + entry.duration_minutes;
      } else if (entry.clock_in && entry.clock_out) {
        return total + differenceInMinutes(
          new Date(entry.clock_out),
          new Date(entry.clock_in)
        );
      }
      return total;
    }, 0);

    const totalTrackedHours = +(totalTrackedMinutes / 60).toFixed(2);
    const remainingHours = Math.max(targetWeeklyHours - totalTrackedHours, 0);

    return { totalTrackedHours, remainingHours };
  };

  return {
    targetWeeklyHours,
    setTargetWeeklyHours,
    calculateWeeklyChartData,
    calculateTrackedTime
  };
}
