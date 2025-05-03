
import React from "react";
import { Timer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDailyPerformance } from "@/hooks/useDailyPerformance";
import DailySummaryCard from "./daily-performance/DailySummaryCard";
import CompletedTasksTable from "./daily-performance/CompletedTasksTable";
import { exportDailyReportCSV } from "./daily-performance/exportUtils";

const DailyPerformanceReport: React.FC = () => {
  const {
    totalHours,
    loading,
    completedToday,
    completedProjectTasks,
    completedPersonalTasks,
    dayStart,
    formattedDate
  } = useDailyPerformance();

  const handleExportCSV = () => {
    exportDailyReportCSV(
      dayStart,
      totalHours,
      completedToday,
      completedProjectTasks.length,
      completedPersonalTasks.length
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex gap-2 items-center">
          <Timer className="w-5 h-5" />
          Daily Performance Report
        </h2>
        <Button variant="secondary" onClick={handleExportCSV} className="gap-2" size="sm">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>
      
      <DailySummaryCard
        totalHours={totalHours}
        loading={loading}
        completedTasksCount={completedToday.length}
        completedProjectTasksCount={completedProjectTasks.length}
        completedPersonalTasksCount={completedPersonalTasks.length}
        formattedDate={formattedDate}
      />
      
      <CompletedTasksTable completedTasks={completedToday} />
    </div>
  );
};

export default DailyPerformanceReport;
