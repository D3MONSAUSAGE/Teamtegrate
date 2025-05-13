
import { format } from "date-fns";
import { Task } from "@/types";

export const exportDailyReportCSV = (
  dayDate: Date,
  totalHours: string,
  completedTasks: Task[],
  projectTasksCount: number,
  personalTasksCount: number
) => {
  const dateStr = format(dayDate, "yyyy-MM-dd");
  
  let csv = [
    ["Daily Performance Report", `${format(dayDate, "yyyy-MM-dd")}`],
    [],
    ["Summary"],
    ["Total Hours Tracked", totalHours],
    ["Completed Tasks", completedTasks.length],
    ["Project Tasks Done", projectTasksCount],
    ["Personal Tasks Done", personalTasksCount],
    [],
    ["Completed Tasks Detail"],
    ["Time", "Task", "Type"]
  ];
  
  completedTasks.forEach(task => {
    const time = task.completedAt || task.updatedAt 
      ? format(new Date(task.completedAt || task.updatedAt), "HH:mm") 
      : "-";
    const type = task.projectId ? "Project" : "Personal";
    csv.push([time, task.title, type]);
  });
  
  // Join and export file
  const csvContent = csv.map(row => row.map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Daily_Performance_Report_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
