
import React from 'react';
import { useTimeTrackingPage } from '@/hooks/useTimeTrackingPage';
import DailyTimeReport from './DailyTimeReport';
import WeeklyTimeReport from './WeeklyTimeReport';
import TimeTrackingSummary from './time/TimeTrackingSummary';
import TimeChartSection from './time/TimeChartSection';
import TimeTrackingControls from './TimeTrackingControls';
import WeekNavigation from './WeekNavigation';
import ConnectionStatus from './ConnectionStatus';

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
    totalWorkedMinutes,
    isOnBreak,
    lastBreakType,
    breakStartTime,
    getWeeklyChartData,
    handleBreak,
    handleWeekChange,
    handleSearch,
    clockIn,
    clockOut,
    selectedDate,
    handleDateChange,
    isLoading,
    lastError,
    isOnline,
    forceRefresh
  } = useTimeTrackingPage();

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  };

  return (
    <div className="space-y-4">
      {/* Connection Status - only shows when there are issues */}
      <ConnectionStatus 
        lastError={lastError}
        onRetry={forceRefresh}
        isLoading={isLoading}
      />

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
        isClocked={Boolean(currentEntry?.isClocked)}
        clockIn={clockIn}
        clockOut={clockOut}
        handleBreak={handleBreak}
        elapsedTime={elapsedTime}
        totalWorkedMinutes={totalWorkedMinutes}
        isOnBreak={Boolean(isOnBreak)}
        lastBreakType={lastBreakType}
        breakStartTime={breakStartTime}
        isLoading={isLoading}
        isOnline={isOnline}
      />

      <WeekNavigation
        weekStart={weekStart}
        weekEnd={weekEnd}
        handleWeekChange={handleWeekChange}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        handleSearch={handleSearch}
        isSearching={Boolean(isSearching)}
        handleExport={handleExport}
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
