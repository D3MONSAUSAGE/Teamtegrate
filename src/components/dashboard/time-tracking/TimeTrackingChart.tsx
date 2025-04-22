
import React from 'react';
import { format, differenceInMinutes } from 'date-fns';
import WeeklyTimeTrackingChart from '../WeeklyTimeTrackingChart';

interface TimeTrackingChartProps {
  weekStart: Date;
  totalTrackedMinutes: number;
  weeklyEntries: any[];
}

const TimeTrackingChart: React.FC<TimeTrackingChartProps> = ({
  weekStart,
  totalTrackedMinutes,
  weeklyEntries,
}) => {
  const getWeeklyChartData = () => {
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    
    return weekDays.map(day => {
      const dateStr = day.toISOString().split("T")[0];
      const dayEntries = weeklyEntries.filter(entry => entry.clock_in.startsWith(dateStr));
      
      const dailyMinutes = dayEntries.reduce((total, entry) => {
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
        day: format(day, 'EEE'),
        totalHours: +(dailyMinutes / 60).toFixed(2)
      };
    });
  };

  return <WeeklyTimeTrackingChart data={getWeeklyChartData()} />;
};

export default TimeTrackingChart;
