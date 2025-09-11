import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, getWeeksInMonth, addMonths, subMonths, setWeek, getWeek, startOfMonth, eachWeekOfInterval, endOfMonth } from 'date-fns';

interface MonthWeekPickerProps {
  selectedWeek: Date;
  onWeekChange: (week: Date) => void;
  className?: string;
}

export function MonthWeekPicker({ selectedWeek, onWeekChange, className = "" }: MonthWeekPickerProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date(selectedWeek.getFullYear(), selectedWeek.getMonth()));

  // Get all weeks in the selected month
  const weeksInMonth = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 } // Start on Monday
    );

    return weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      return {
        weekNumber: index + 1,
        weekStart,
        weekEnd,
        label: `Week ${index + 1} (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')})`
      };
    });
  }, [selectedMonth]);

  // Find current selected week in the list
  const currentWeekIndex = weeksInMonth.findIndex(week => 
    getWeek(week.weekStart, { weekStartsOn: 1 }) === getWeek(selectedWeek, { weekStartsOn: 1 }) &&
    week.weekStart.getMonth() === selectedWeek.getMonth()
  );

  const handlePreviousMonth = () => {
    const prevMonth = subMonths(selectedMonth, 1);
    setSelectedMonth(prevMonth);
    // Auto-select first week of previous month
    if (weeksInMonth.length > 0) {
      const firstWeekOfPrevMonth = eachWeekOfInterval(
        { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) },
        { weekStartsOn: 1 }
      )[0];
      onWeekChange(firstWeekOfPrevMonth);
    }
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    setSelectedMonth(nextMonth);
    // Auto-select first week of next month
    if (weeksInMonth.length > 0) {
      const firstWeekOfNextMonth = eachWeekOfInterval(
        { start: startOfMonth(nextMonth), end: endOfMonth(nextMonth) },
        { weekStartsOn: 1 }
      )[0];
      onWeekChange(firstWeekOfNextMonth);
    }
  };

  const handleWeekSelect = (weekNumber: string) => {
    const weekIndex = parseInt(weekNumber) - 1;
    const selectedWeekData = weeksInMonth[weekIndex];
    if (selectedWeekData) {
      onWeekChange(selectedWeekData.weekStart);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <div className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(selectedMonth, 'MMMM yyyy')}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Week:</label>
        <Select 
          value={currentWeekIndex >= 0 ? (currentWeekIndex + 1).toString() : ""} 
          onValueChange={handleWeekSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a week" />
          </SelectTrigger>
          <SelectContent>
            {weeksInMonth.map((week) => (
              <SelectItem key={week.weekNumber} value={week.weekNumber.toString()}>
                {week.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Week Display */}
      {currentWeekIndex >= 0 && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <strong>Selected:</strong> {weeksInMonth[currentWeekIndex]?.label}
        </div>
      )}
    </div>
  );
}