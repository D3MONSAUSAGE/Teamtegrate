
import React, { useState, useEffect } from 'react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { startOfWeek, addDays, addWeeks, subWeeks, differenceInMinutes } from 'date-fns';
import { Card } from "@/components/ui/card";
import TimeTrackingHeader from './time-tracking/TimeTrackingHeader';
import ClockInOutSection from './time-tracking/ClockInOutSection';
import WeekSelector from './time-tracking/WeekSelector';
import WeeklyTimeReport from './WeeklyTimeReport';
import DailyTimeReport from './DailyTimeReport';
import WeeklyTimeTrackingChart from './WeeklyTimeTrackingChart';
import { formatDuration, downloadCSV } from './time-tracking/utils';

function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return { start, end };
}

const TimeTracking: React.FC = () => {
  const { currentEntry, clockIn, clockOut, fetchTimeEntriesForWeek } = useTimeTracking();
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('');
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<any[]>([]);
  const [weekDate, setWeekDate] = useState<Date>(new Date());
  const [targetWeeklyHours, setTargetWeeklyHours] = useState<number>(() => {
    const stored = localStorage.getItem("targetWeeklyHours");
    return stored ? Number(stored) : 40;
  });

  const { start: weekStart, end: weekEnd } = getWeekRange(weekDate);

  const getWeeklyChartData = () => {
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
        day: format(day, 'EEE'),
        totalHours: +(totalMinutes / 60).toFixed(2)
      };
    });
  };

  useEffect(() => {
    localStorage.setItem("targetWeeklyHours", String(targetWeeklyHours));
  }, [targetWeeklyHours]);

  useEffect(() => {
    const fetchEntries = async () => {
      const entries = await fetchTimeEntriesForWeek(weekDate);
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = entries.filter(entry => entry.clock_in.startsWith(today));
      setDailyEntries(todayEntries);
      setWeeklyEntries(entries);
    };
    fetchEntries();
  }, [currentEntry, weekDate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentEntry.isClocked && currentEntry.clock_in) {
      interval = setInterval(() => {
        const elapsedMs = Date.now() - new Date(currentEntry.clock_in!).getTime();
        setElapsedTime(formatDuration(elapsedMs));
      }, 1000);
    } else {
      setElapsedTime("");
    }
    return () => clearInterval(interval);
  }, [currentEntry]);

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

  const handleWeekChange = (direction: "prev" | "next") => {
    setWeekDate(
      direction === "prev" ? subWeeks(weekDate, 1) : addWeeks(weekDate, 1)
    );
  };

  const handleWeekSearch = (date: Date) => {
    setWeekDate(date);
  };

  return (
    <div className="space-y-4">
      <TimeTrackingHeader
        targetWeeklyHours={targetWeeklyHours}
        totalTrackedHours={totalTrackedHours}
        remainingHours={remainingHours}
        setTargetWeeklyHours={setTargetWeeklyHours}
      />

      <WeeklyTimeTrackingChart data={getWeeklyChartData()} />

      <ClockInOutSection
        notes={notes}
        setNotes={setNotes}
        isClocked={currentEntry.isClocked}
        elapsedTime={elapsedTime}
        onClockIn={clockIn}
        onClockOut={clockOut}
        onBreak={(breakType) => clockOut(`${breakType} break started`)}
      />

      <WeekSelector
        weekStart={weekStart}
        weekEnd={weekEnd}
        onWeekChange={handleWeekChange}
        onExportCsv={() => downloadCSV(weeklyEntries, weekStart, weekEnd)}
      />

      <DailyTimeReport entries={dailyEntries} />
      <WeeklyTimeReport entries={weeklyEntries} />
    </div>
  );
};

export default TimeTracking;
