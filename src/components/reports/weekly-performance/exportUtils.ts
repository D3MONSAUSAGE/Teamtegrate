
import { format } from "date-fns";
import { Task } from "@/types";

export const exportWeeklyReportCSV = (
  weekStart: Date,
  weekEnd: Date,
  totalHours: string,
  completedTasks: Task[],
  projectTasksCount: number,
  personalTasksCount: number
) => {
  const dateStr = format(weekStart, "yyyy-MM-dd");
  
  let csv = [
    ["Weekly Performance Report", `${format(weekStart, "yyyy-MM-dd")} to ${format(weekEnd, "yyyy-MM-dd")}`],
    [],
    ["Summary"],
    ["Total Hours Tracked", totalHours],
    ["Completed Tasks", completedTasks.length],
    ["Project Tasks Done", projectTasksCount],
    ["Personal Tasks Done", personalTasksCount],
    [],
    ["Completed Tasks Detail"],
    ["Date", "Task", "Type"]
  ];
  
  completedTasks.forEach(task => {
    const date = task.completedAt || task.updatedAt 
      ? format(new Date(task.completedAt || task.updatedAt), "MMM d") 
      : "-";
    const type = task.projectId ? "Project" : "Personal";
    csv.push([date, task.title, type]);
  });
  
  // Join and export file
  const csvContent = csv.map(row => row.map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Weekly_Performance_Report_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
