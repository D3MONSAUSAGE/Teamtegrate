import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { format, startOfWeek, addWeeks, subWeeks, addDays, differenceInMinutes } from 'date-fns';
import { Clock, TimerOff, Coffee, UtensilsCrossed, FileText, CalendarDays, Search, Target } from 'lucide-react';
import DailyTimeReport from './DailyTimeReport';
import WeeklyTimeReport from './WeeklyTimeReport';
import WeeklyTimeTrackingChart from './WeeklyTimeTrackingChart';
import TargetHoursCard from "./TargetHoursCard";
import TimeTrackingControls from "./TimeTrackingControls";
import WeekNavigation from "./WeekNavigation";

function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return { start, end };
}

function downloadCSV(entries: any[], weekStart: Date, weekEnd: Date) {
  if (!entries || !entries.length) return;
  const cols = ["Day", "Clock In", "Clock Out", "Duration (mins)", "Notes"];
  let csv = cols.join(",") + "\n";
  entries.forEach((entry) => {
    const day = format(new Date(entry.clock_in), "yyyy-MM-dd (EEEE)");
    const clockIn = format(new Date(entry.clock_in), "HH:mm");
    const clockOut = entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "";
    const duration = entry.duration_minutes ?? "";
    const notes = entry.notes ? `"${(entry.notes + "").replace(/"/g, '""')}"` : "";
    csv += [day, clockIn, clockOut, duration, notes].join(",") + "\n";
  });
  const fileName = `Weekly_Time_Report_${format(weekStart, "yyyyMMdd")}_${format(weekEnd, "yyyyMMdd")}.csv`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : n.toString());
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

const TimeTracking: React.FC = () => {
  const { currentEntry, clockIn, clockOut, getWeeklyTimeEntries } = useTimeTracking();
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('');
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<any[]>([]);
  const [weekDate, setWeekDate] = useState<Date>(new Date());
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

  useEffect(() => {
    const fetchEntries = async () => {
      const entries = await getWeeklyTimeEntries(weekStart);
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = entries.filter(entry => entry.clock_in.startsWith(today));
      setDailyEntries(todayEntries);
      setWeeklyEntries(entries);
    };
    fetchEntries();
  }, [currentEntry, weekStart.getTime()]);

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

  useEffect(() => {
    localStorage.setItem("targetWeeklyHours", String(targetWeeklyHours));
  }, [targetWeeklyHours]);

  const handleBreak = (breakType: string) => {
    clockOut(`${breakType} break started`);
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    setWeekDate(
      direction === "prev" ? subWeeks(weekDate, 1) : addWeeks(weekDate, 1)
    );
  };

  const handleSearch = () => {
    setIsSearching(true);
    let date: Date | null = null;
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(searchValue)) {
        date = new Date(searchValue);
      } else if (/^\d{4}-\d{2}$/.test(searchValue)) {
        date = new Date(searchValue + "-01");
      } else {
        throw new Error("Invalid date format");
      }
      setWeekDate(date);
    } catch {
      // Ignore and do nothing if invalid
    }
    setIsSearching(false);
  };

  const handleExport = () => {
    downloadCSV(weeklyEntries, weekStart, weekEnd);
  };

  return (
    <div className="space-y-4">
      <TargetHoursCard
        targetWeeklyHours={targetWeeklyHours}
        setTargetWeeklyHours={setTargetWeeklyHours}
        totalTrackedHours={totalTrackedHours}
        remainingHours={remainingHours}
      />

      <WeeklyTimeTrackingChart data={getWeeklyChartData()} />

      <Card>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimeTrackingControls
            notes={notes}
            setNotes={setNotes}
            isClocked={currentEntry.isClocked}
            clockIn={clockIn}
            clockOut={clockOut}
            handleBreak={handleBreak}
            elapsedTime={elapsedTime}
          />
        </CardContent>
      </Card>

      <WeekNavigation
        weekStart={weekStart}
        weekEnd={weekEnd}
        handleWeekChange={handleWeekChange}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        handleSearch={handleSearch}
        isSearching={isSearching}
        handleExport={handleExport}
      />

      <DailyTimeReport entries={dailyEntries} />
      <WeeklyTimeReport entries={weeklyEntries} />
    </div>
  );
};

export default TimeTracking;
