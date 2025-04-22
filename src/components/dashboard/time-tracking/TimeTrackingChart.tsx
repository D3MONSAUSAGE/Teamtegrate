
import React from 'react';
import { format } from 'date-fns';
import WeeklyTimeTrackingChart from '../WeeklyTimeTrackingChart';

interface TimeTrackingChartProps {
  weekStart: Date;
  totalTrackedMinutes: number;
}

const TimeTrackingChart: React.FC<TimeTrackingChartProps> = ({
  weekStart,
  totalTrackedMinutes,
}) => {
  const getWeeklyChartData = () => {
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    return weekDays.map(day => ({
      day: format(day, 'EEE'),
      totalHours: +(totalTrackedMinutes / 60).toFixed(2)
    }));
  };

  return <WeeklyTimeTrackingChart data={getWeeklyChartData()} />;
};

export default TimeTrackingChart;
