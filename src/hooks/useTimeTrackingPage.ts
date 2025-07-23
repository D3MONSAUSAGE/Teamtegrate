import { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays, differenceInMinutes, parseISO } from 'date-fns';
import { useTimeTracking } from './useTimeTracking';
import { toast } from 'sonner';
import { debounce } from '@/utils/requestManager';

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

interface BreakState {
  isOnBreak: boolean;
  breakType?: string;
  breakStartTime?: Date;
  workSessionId?: string;
}

export const useTimeTrackingPage = () => {
  const { 
    currentEntry, 
    clockIn, 
    clockOut, 
    startBreak, 
    getWeeklyTimeEntries, 
    fetchTimeEntries,
    isLoading,
    lastError,
    isOnline,
    forceRefresh
  } = useTimeTracking();
  
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('');
  const [breakElapsedTime, setBreakElapsedTime] = useState('');
  const [dailyEntries, setDailyEntries] = useState<TimeEntry[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<TimeEntry[]>([]);
  const [weekDate, setWeekDate] = useState<Date>(new Date());
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [targetWeeklyHours, setTargetWeeklyHours] = useState<number>(() => {
    const stored = localStorage.getItem("targetWeeklyHours");
    return stored ? Number(stored) : 40;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [breakState, setBreakState] = useState<BreakState>({
    isOnBreak: false
  });

  // Refs for cleanup
  const workTimerRef = useRef<NodeJS.Timeout>();
  const breakTimerRef = useRef<NodeJS.Timeout>();
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  const { start: weekStart, end: weekEnd } = getWeekRange(weekDate);

  // Debounced data fetching with proper cleanup
  const fetchEntriesDebounced = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        const entries = await getWeeklyTimeEntries(weekStart);
        setWeeklyEntries(entries);
        
        const filteredDailyEntries = filterDailyEntries(entries, selectedDate);
        setDailyEntries(filteredDailyEntries);
      } catch (error) {
        console.error('Error fetching weekly entries:', error);
      }
    }, 300);
  }, [weekStart, selectedDate, getWeeklyTimeEntries]);

  // Fetch entries when dependencies change
  useEffect(() => {
    fetchEntriesDebounced();
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchEntriesDebounced]);

  // Work session timer with proper cleanup
  useEffect(() => {
    if (workTimerRef.current) {
      clearInterval(workTimerRef.current);
    }
    
    if (currentEntry.isClocked && currentEntry.clock_in && !breakState.isOnBreak) {
      const updateElapsedTime = () => {
        try {
          const elapsedMs = Date.now() - currentEntry.clock_in!.getTime();
          setElapsedTime(formatDuration(elapsedMs));
        } catch (error) {
          console.error('Error updating elapsed time:', error);
          setElapsedTime('00:00:00');
        }
      };

      updateElapsedTime();
      workTimerRef.current = setInterval(updateElapsedTime, 1000);
    } else {
      setElapsedTime('00:00:00');
    }

    return () => {
      if (workTimerRef.current) {
        clearInterval(workTimerRef.current);
      }
    };
  }, [currentEntry.isClocked, currentEntry.clock_in, breakState.isOnBreak]);

  // Break timer with proper cleanup
  useEffect(() => {
    if (breakTimerRef.current) {
      clearInterval(breakTimerRef.current);
    }
    
    if (breakState.isOnBreak && breakState.breakStartTime) {
      const updateBreakTime = () => {
        try {
          const elapsedMs = Date.now() - breakState.breakStartTime!.getTime();
          const validElapsedMs = Math.max(0, elapsedMs);
          setBreakElapsedTime(formatDuration(validElapsedMs));
        } catch (error) {
          console.error('Error updating break time:', error);
          setBreakElapsedTime('00:00:00');
        }
      };

      updateBreakTime();
      breakTimerRef.current = setInterval(updateBreakTime, 1000);
    } else {
      setBreakElapsedTime('00:00:00');
    }

    return () => {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
      }
    };
  }, [breakState.isOnBreak, breakState.breakStartTime]);

  // Calculate metrics
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

  const getWeeklyChartData = useCallback((): WeeklyChartData[] => {
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
  }, [weekStart, weeklyEntries]);

  const filterDailyEntries = useCallback((entries: TimeEntry[], date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.filter(entry => {
      const entryDate = format(new Date(entry.clock_in), 'yyyy-MM-dd');
      return entryDate === dateStr;
    });
  }, []);

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
        setSelectedDate(date);
      } else if (/^\d{4}-\d{2}$/.test(searchValue)) {
        date = new Date(searchValue + "-01");
      } else {
        throw new Error("Invalid date format");
      }
      setWeekDate(date);
    } catch {
      toast.error('Invalid date format. Use YYYY-MM-DD or YYYY-MM');
    }
    setIsSearching(false);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    
    const currentWeekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
    const currentWeekEnd = addDays(currentWeekStart, 6);
    
    if (date < currentWeekStart || date > currentWeekEnd) {
      setWeekDate(date);
    }
    
    const filteredEntries = filterDailyEntries(weeklyEntries, date);
    setDailyEntries(filteredEntries);
  };

  const handleBreak = async (breakType: string) => {
    if (!isOnline) {
      toast.error('Cannot start break while offline');
      return;
    }
    
    if (!currentEntry.isClocked) {
      toast.error('No active session to take a break from');
      return;
    }

    try {
      setBreakState({
        isOnBreak: true,
        breakType,
        breakStartTime: new Date(),
        workSessionId: currentEntry.id
      });

      const breakNotes = `${breakType} break session:${currentEntry.id}`;
      await startBreak(breakType, breakNotes);
      
      toast.success(`${breakType} break started`);
    } catch (error) {
      console.error('Error starting break:', error);
      setBreakState({ isOnBreak: false });
      toast.error('Failed to start break');
    }
  };

  const resumeFromBreak = async () => {
    if (!breakState.isOnBreak) {
      toast.error('Not currently on break');
      return;
    }

    try {
      const resumeNotes = `Resumed from ${breakState.breakType} break`;
      setBreakState({ isOnBreak: false });
      await clockIn(resumeNotes);
      toast.success(`Resumed from ${breakState.breakType} break`);
    } catch (error) {
      console.error('Error resuming from break:', error);
      setBreakState({
        isOnBreak: true,
        breakType: breakState.breakType,
        breakStartTime: breakState.breakStartTime,
        workSessionId: breakState.workSessionId
      });
      toast.error('Failed to resume from break');
    }
  };

  const enhancedClockIn = async (notes?: string) => {
    if (!isOnline) {
      toast.error('Cannot clock in while offline. Please check your connection.');
      return;
    }
    
    if (isLoading) {
      toast.warning('Please wait, operation in progress...');
      return;
    }

    try {
      await clockIn(notes);
      setNotes('');
      setBreakState({ isOnBreak: false });
    } catch (error) {
      console.error('Clock in failed:', error);
      toast.error('Failed to clock in. Please try again.');
    }
  };

  const enhancedClockOut = async (notes?: string) => {
    if (!isOnline) {
      toast.error('Cannot clock out while offline. Please check your connection.');
      return;
    }
    
    if (isLoading) {
      toast.warning('Please wait, operation in progress...');
      return;
    }

    try {
      await clockOut(notes);
      setNotes('');
      setBreakState({ isOnBreak: false });
    } catch (error) {
      console.error('Clock out failed:', error);
      toast.error('Failed to clock out. Please try again.');
    }
  };

  // Save target hours to localStorage
  useEffect(() => {
    localStorage.setItem("targetWeeklyHours", String(targetWeeklyHours));
  }, [targetWeeklyHours]);

  return {
    notes,
    setNotes,
    elapsedTime,
    breakElapsedTime,
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
    totalWorkedMinutes: totalTrackedMinutes,
    breakState,
    getWeeklyChartData,
    handleBreak,
    resumeFromBreak,
    handleWeekChange,
    handleSearch,
    clockIn: enhancedClockIn,
    clockOut: enhancedClockOut,
    selectedDate,
    handleDateChange,
    isLoading,
    lastError,
    isOnline,
    forceRefresh
  };
};

// Helper functions
function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addDays(start, 6);
  return { start, end };
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : n.toString());
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
