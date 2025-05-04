
import { useState, useEffect } from 'react';
import { useTimeTracking } from './useTimeTracking';
import { useTimeTrackingData } from './time-tracking/useTimeTrackingData';
import { useTimeTrackingNavigation } from './time-tracking/useTimeTrackingNavigation';
import { 
  getWeekRange, 
  formatDuration, 
  filterDailyEntries 
} from './time-tracking/timeTrackingUtils';

export const useTimeTrackingPage = () => {
  const { currentEntry, clockIn, clockOut, getWeeklyTimeEntries } = useTimeTracking();
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('');
  const [dailyEntries, setDailyEntries] = useState([]);
  const [weeklyEntries, setWeeklyEntries] = useState([]);

  const {
    targetWeeklyHours,
    setTargetWeeklyHours,
    calculateWeeklyChartData,
    calculateTrackedTime
  } = useTimeTrackingData();

  const {
    weekDate,
    searchValue,
    setSearchValue,
    isSearching,
    selectedDate,
    handleWeekChange,
    handleSearch,
    handleDateChange
  } = useTimeTrackingNavigation();

  const { start: weekStart, end: weekEnd } = getWeekRange(weekDate);
  
  const getWeeklyChartData = () => {
    return calculateWeeklyChartData(weeklyEntries, weekStart);
  };

  const { totalTrackedHours, remainingHours } = calculateTrackedTime(weeklyEntries);

  // Handle break functionality
  const handleBreak = (breakType: string) => {
    clockOut(`${breakType} break started`);
  };

  // Effects for data fetching
  useEffect(() => {
    const fetchEntries = async () => {
      const entries = await getWeeklyTimeEntries(weekStart);
      setWeeklyEntries(entries);
      
      // Set daily entries based on selected date
      const filteredDailyEntries = filterDailyEntries(entries, selectedDate);
      setDailyEntries(filteredDailyEntries);
    };
    fetchEntries();
  }, [currentEntry, weekStart, selectedDate, getWeeklyTimeEntries]);

  // Timer effect for elapsed time
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

  // Save target hours to localStorage
  useEffect(() => {
    localStorage.setItem("targetWeeklyHours", String(targetWeeklyHours));
  }, [targetWeeklyHours]);

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
