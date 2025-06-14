
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
    breakElapsedTime,
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
    breakState,
    getWeeklyChartData,
    handleBreak,
    resumeFromBreak,
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
        resumeFromBreak={resumeFromBreak}
        elapsedTime={elapsedTime}
        breakElapsedTime={breakElapsedTime}
        totalWorkedMinutes={totalWorkedMinutes}
        breakState={breakState}
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
