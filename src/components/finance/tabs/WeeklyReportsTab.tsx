import React, { useState } from 'react';
import WeeklySalesView from '@/components/finance/WeeklySalesView';
import SalesDateRangeView from '@/components/finance/SalesDateRangeView';
import { useSalesManager } from '@/hooks/useSalesManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays } from 'lucide-react';

const WeeklyReportsTab: React.FC = () => {
  const {
    salesData,
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

  const [activeView, setActiveView] = useState<'weekly' | 'daterange'>('daterange');

  const teamName = selectedTeam === 'all' 
    ? 'All Teams' 
    : teams.find(t => t.id === selectedTeam)?.name || selectedTeam;

  return (
    <div className="space-y-6">
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'weekly' | 'daterange')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="daterange" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range View
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Weekly Navigator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daterange" className="mt-6">
          <SalesDateRangeView
            salesData={salesData}
            selectedTeam={selectedTeam}
            teamName={teamName}
            onDeleteDay={deleteSalesDataByDate}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WeeklyReportsTab;