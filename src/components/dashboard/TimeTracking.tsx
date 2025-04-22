
import React, { useState, useEffect } from 'react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { startOfWeek, addDays, addWeeks, subWeeks, format, differenceInMinutes } from 'date-fns';
import TimeTrackingHeader from './time-tracking/TimeTrackingHeader';
import ClockInOutSection from './time-tracking/ClockInOutSection';
import WeekSelector from './time-tracking/WeekSelector';
import WeeklyTimeReport from './WeeklyTimeReport';
import DailyTimeReport from './DailyTimeReport';
import WeeklyTimeTrackingChart from './WeeklyTimeTrackingChart';
import { formatDuration, downloadCSV } from './time-tracking/utils';
import TimeTrackingChart from './time-tracking/TimeTrackingChart';

function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return { start, end };
}

const TimeTracking: React.FC = () => {
  const { currentEntry, clockIn, clockOut, fetchTimeEntriesForWeek, fetchPreviousWeekTimeEntries } = useTimeTracking();
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('');
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<any[]>([]);
  const [weekDate, setWeekDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [targetWeeklyHours, setTargetWeeklyHours] = useState<number>(() => {
    const stored = localStorage.getItem("targetWeeklyHours");
    return stored ? Number(stored) : 40;
  });

  const { start: weekStart, end: weekEnd } = getWeekRange(weekDate);

  useEffect(() => {
    localStorage.setItem("targetWeeklyHours", String(targetWeeklyHours));
  }, [targetWeeklyHours]);

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      try {
        // Get entries for the selected week
        const entries = await fetchTimeEntriesForWeek(weekDate);
        
        // If we're viewing the current week, get today's entries for the daily report
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = entries.filter(entry => entry.clock_in.startsWith(today));
        setDailyEntries(todayEntries);
        
        setWeeklyEntries(entries);
        
        // If we're viewing previous week and got no entries, try the specific previous week function
        const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const selectedWeekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
        
        if (entries.length === 0 && selectedWeekStart < currentWeekStart) {
          console.log("No entries found for selected week, trying specific previous week fetch");
          const prevWeekEntries = await fetchPreviousWeekTimeEntries();
          if (prevWeekEntries.length > 0) {
            setWeeklyEntries(prevWeekEntries);
          }
        }
      } catch (error) {
        console.error("Error fetching time entries:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEntries();
  }, [currentEntry, weekDate, fetchTimeEntriesForWeek, fetchPreviousWeekTimeEntries]);

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
    // Force the entries to be refreshed
    setWeeklyEntries([]);
  };

  const handleWeekSearch = (date: Date) => {
    setWeekDate(date);
    // Force the entries to be refreshed
    setWeeklyEntries([]);
  };

  return (
    <div className="space-y-4">
      <TimeTrackingHeader
        targetWeeklyHours={targetWeeklyHours}
        totalTrackedHours={totalTrackedHours}
        remainingHours={remainingHours}
        setTargetWeeklyHours={setTargetWeeklyHours}
      />

      <TimeTrackingChart 
        weekStart={weekStart}
        totalTrackedMinutes={totalTrackedMinutes}
        weeklyEntries={weeklyEntries}
      />

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

      {isLoading ? (
        <div className="p-4 text-center text-muted-foreground">
          Loading time entries...
        </div>
      ) : weeklyEntries.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          No time entries found for this week.
        </div>
      ) : (
        <>
          <DailyTimeReport entries={dailyEntries} />
          <WeeklyTimeReport entries={weeklyEntries} />
        </>
      )}
    </div>
  );
};

export default TimeTracking;
