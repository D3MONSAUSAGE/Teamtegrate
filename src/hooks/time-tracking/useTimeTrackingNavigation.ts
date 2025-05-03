
import { useState } from 'react';
import { startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';

export function useTimeTrackingNavigation() {
  const [weekDate, setWeekDate] = useState<Date>(new Date());
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    
    // If the new date is outside the current week, update week view too
    const currentWeekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
    const currentWeekEnd = addDays(currentWeekStart, 6);
    
    if (date < currentWeekStart || date > currentWeekEnd) {
      setWeekDate(date);
    }
  };

  return {
    weekDate,
    setWeekDate,
    searchValue,
    setSearchValue,
    isSearching,
    setIsSearching,
    selectedDate,
    setSelectedDate,
    handleWeekChange,
    handleSearch,
    handleDateChange
  };
}
