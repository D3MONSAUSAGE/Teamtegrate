
import { useState, useEffect } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays, differenceInMinutes, isToday, parseISO } from 'date-fns';
import { useTimeTracking } from './useTimeTracking';

interface TimeEntry {
  clock_in: string;
  clock_out?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
}

interface WeeklyChartData {
  day: string;
  totalHours: number;
}

export const useTimeTrackingPage = () => {
  const { currentEntry, clockIn, clockOut, getWeeklyTimeEntries } = useTimeTracking();
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('');
  const [dailyEntries, setDailyEntries] = useState<TimeEntry[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<TimeEntry[]>([]);
  const [weekDate, setWeekDate] = useState<Date>(new Date());
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [targetWeeklyHours, setTargetWeeklyHours] = useState<number>(() => {
    const stored = localStorage.getItem("targetWeeklyHours");
    return stored ? Number(stored) : 40;
  });
  // Selected date for daily entries, defaults to today
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { start: weekStart, end: weekEnd } = getWeekRange(weekDate);

  const getWeeklyChartData = (): WeeklyChartData[] => {
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

  // Filter daily entries based on selected date (today or a specific date)
  const filterDailyEntries = (entries: TimeEntry[], date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.filter(entry => {
      const entryDate = format(new Date(entry.clock_in), 'yyyy-MM-dd');
      return entryDate === dateStr;
    });
  };

  useEffect(() => {
    const fetchEntries = async () => {
      const entries = await getWeeklyTimeEntries(weekStart);
      setWeeklyEntries(entries);
      
      // Set daily entries based on selected date (defaults to today)
      const filteredDailyEntries = filterDailyEntries(entries, selectedDate);
      setDailyEntries(filteredDailyEntries);
    };
    fetchEntries();
  }, [currentEntry, weekStart, selectedDate]);

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
        setSelectedDate(date); // Update selected date when searching
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

  // Handler for changing the selected date for daily view
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    
    // If the new date is outside the current week, update week view too
    const currentWeekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
    const currentWeekEnd = addDays(currentWeekStart, 6);
    
    if (date < currentWeekStart || date > currentWeekEnd) {
      setWeekDate(date);
    }
    
    // Update daily entries based on the new selected date
    const filteredEntries = filterDailyEntries(weeklyEntries, date);
    setDailyEntries(filteredEntries);
  };

  return {
    notes,
    setNotes,
    elapsedTime,
    dailyEntries,
    weeklyEntries,
    currentEntry,
    weekDate,
    weekStart,
    weekEnd,
    searchValue,
    setSearchValue,
    isSearching,
    targetWeeklyHours,
    setTargetWeeklyHours,
    totalTrackedHours,
    remainingHours,
    getWeeklyChartData,
    handleBreak,
    handleWeekChange,
    handleSearch,
    clockIn,
    clockOut,
    selectedDate,
    handleDateChange
  };
};

// Helper functions
function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return { start, end };
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : n.toString());
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
