
import React from 'react';
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage';
import DailyTimeReport from './DailyTimeReport';
import WeeklyTimeReport from './WeeklyTimeReport';
import TimeTrackingSummary from './time/TimeTrackingSummary';
import TimeChartSection from './time/TimeChartSection';
import TimeTrackingControls from './TimeTrackingControls';
import WeekNavigation from './WeekNavigation';
import { format } from 'date-fns';

const TimeTracking: React.FC = () => {
  const {
    notes,
    setNotes,
    elapsedTime,
    dailyEntries,
    weeklyEntries,
    currentEntry,
    weekStart,
    weekEnd,
    weekDate,
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
  } = useTimeTrackingPage();

  return (
    <div className="space-y-4">
      <TimeTrackingSummary
        targetWeeklyHours={targetWeeklyHours}
        setTargetWeeklyHours={setTargetWeeklyHours}
        totalTrackedHours={totalTrackedHours}
        remainingHours={remainingHours}
      />

      <TimeChartSection data={getWeeklyChartData()} />

      <TimeTrackingControls
        notes={notes}
        setNotes={setNotes}
        isClocked={currentEntry.isClocked}
        clockIn={clockIn}
        clockOut={clockOut}
        handleBreak={handleBreak}
        elapsedTime={elapsedTime}
      />

      <WeekNavigation
        weekStart={weekStart}
        weekEnd={weekEnd}
        handleWeekChange={handleWeekChange}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        handleSearch={handleSearch}
        isSearching={isSearching}
        handleExport={() => {}}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />

      <DailyTimeReport 
        entries={dailyEntries} 
        selectedDate={selectedDate} 
      />
      
      <WeeklyTimeReport 
        entries={weeklyEntries} 
        weekDate={weekDate}
        selectedDate={selectedDate}
        onDateSelect={handleDateChange}
      />
    </div>
  );
};

export default TimeTracking;
