
import React from "react";
import { Timer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeeklyPerformance } from "@/hooks/useWeeklyPerformance";
import WeeklySummaryCard from "./weekly-performance/WeeklySummaryCard";
import CompletedTasksTable from "./weekly-performance/CompletedTasksTable";
import { exportWeeklyReportCSV } from "./weekly-performance/exportUtils";
import { toast } from "@/components/ui/use-toast";

const WeeklyPerformanceReport: React.FC = () => {
  const {
    totalHours,
    displayTotalHours,
    loading,
    completedThisWeek,
    completedProjectTasks,
    completedPersonalTasks,
    weekStart,
    weekEnd,
    formattedDateRange
  } = useWeeklyPerformance();

  const handleExportCSV = () => {
    try {
      exportWeeklyReportCSV(
        weekStart,
        weekEnd,
        totalHours,
        completedThisWeek,
        completedProjectTasks.length,
        completedPersonalTasks.length
      );
      toast({
        title: "Report exported",
        description: "Your weekly report has been exported as CSV."
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your report.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex gap-2 items-center">
          <Timer className="w-5 h-5" />
          Weekly Performance Report
        </h2>
        <Button variant="secondary" onClick={handleExportCSV} className="gap-2" size="sm">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>
      
      <WeeklySummaryCard
        totalHours={displayTotalHours}
        loading={loading}
        completedTasksCount={completedThisWeek.length}
        completedProjectTasksCount={completedProjectTasks.length}
        completedPersonalTasksCount={completedPersonalTasks.length}
        formattedDateRange={formattedDateRange}
      />
      
      <CompletedTasksTable completedTasks={completedThisWeek} />
    </div>
  );
};

export default WeeklyPerformanceReport;
