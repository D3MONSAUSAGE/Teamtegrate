import React from 'react';
import WeeklySalesView from '@/components/finance/WeeklySalesView';
import { useSalesManager } from '@/hooks/useSalesManager';

const WeeklyReportsTab: React.FC = () => {
  const {
    weeklyData,
    selectedWeek,
    setSelectedWeek,
    selectedTeam,
    setSelectedTeam,
    teams,
    weeksWithData,
    totalRecords,
    isLoading,
    deleteSalesDataByDate
  } = useSalesManager();

  return (
    <div className="space-y-6">
      <WeeklySalesView
        weeklyData={weeklyData}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
        teams={teams}
        weeksWithData={weeksWithData}
        totalRecords={totalRecords}
        isLoading={isLoading}
        onDeleteDay={deleteSalesDataByDate}
      />
    </div>
  );
};

export default WeeklyReportsTab;