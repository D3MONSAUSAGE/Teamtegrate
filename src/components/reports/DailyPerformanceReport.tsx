
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTask } from "@/contexts/task/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes, isToday, format } from "date-fns";
import { Timer, FileCheck2, FolderKanban, Download } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
}

const DailyPerformanceReport: React.FC = () => {
  const { tasks } = useTask();
  const { user } = useAuth();

  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch today's time entries
  useEffect(() => {
    if (!user) return;
    const fetchTodayEntries = async () => {
      setLoading(true);
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("clock_in", start.toISOString())
        .lt("clock_in", end.toISOString())
        .order("clock_in", { ascending: true });

      setTodayEntries(data || []);
      setLoading(false);
    };
    fetchTodayEntries();
  }, [user]);

  // Calculate total tracked minutes for today
  const totalMinutes = todayEntries.reduce((total, entry) => {
    if (entry.duration_minutes) {
      return total + entry.duration_minutes;
    }
    if (entry.clock_in && entry.clock_out) {
      return total + differenceInMinutes(
        new Date(entry.clock_out), new Date(entry.clock_in)
      );
    }
    return total;
  }, 0);

  const totalHours = (totalMinutes / 60).toFixed(2);

  // Find today's completed tasks and project tasks
  const today = new Date();
  const completedToday = tasks.filter(
    t => t.status === "Completed" && isToday(t.updatedAt)
  );
  const completedProjectTasks = completedToday.filter(
    t => !!t.projectId
  );
  const completedPersonalTasks = completedToday.filter(
    t => !t.projectId
  );

  // CSV export implementation
  const exportCSV = () => {
    const dateStr = format(today, "yyyy-MM-dd");
    let csv = [
      ["Performance Report", dateStr],
      [],
      ["Summary"],
      ["Total Hours Tracked", totalHours],
      ["Completed Tasks", completedToday.length],
      ["Project Tasks Done", completedProjectTasks.length],
      ["Personal Tasks Done", completedPersonalTasks.length],
      [],
      ["Completed Tasks Detail"],
      ["Time", "Task", "Type"]
    ];
    completedToday.forEach(task => {
      const time = task.updatedAt ? format(new Date(task.updatedAt), "p") : "-";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex gap-2 items-center">
          <Timer className="w-5 h-5" />
          Daily Performance Report
        </h2>
        <Button variant="secondary" onClick={exportCSV} className="gap-2" size="sm">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Today's Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:gap-12">
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-muted-foreground text-xs">Total Hours Tracked</span>
            <span className="text-2xl font-bold text-primary">{loading ? <Skeleton className="w-14 h-6" /> : `${totalHours} h`}</span>
          </div>
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-muted-foreground text-xs flex gap-1 items-center"><FileCheck2 size={14}/>Completed Tasks</span>
            <span className="text-xl font-semibold">{completedToday.length}</span>
          </div>
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-muted-foreground text-xs flex gap-1 items-center"><FolderKanban size={14}/>Project Tasks Done</span>
            <span className="text-xl font-semibold">{completedProjectTasks.length}</span>
          </div>
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-muted-foreground text-xs">Personal Tasks Done</span>
            <span className="text-xl font-semibold">{completedPersonalTasks.length}</span>
          </div>
        </CardContent>
      </Card>
      {/* List Completed Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileCheck2 size={18}/> Completed Tasks Today</CardTitle>
        </CardHeader>
        <CardContent>
          {completedToday.length === 0 ? (
            <div className="text-muted-foreground">No tasks completed today.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedToday.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>
                      {task.updatedAt ? format(new Date(task.updatedAt), "p") : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] whitespace-pre-line">
                      {task.title}
                    </TableCell>
                    <TableCell>
                      {task.projectId ? 
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded-md text-xs">Project</span>
                        : <span className="px-2 py-1 bg-neutral-100 text-muted-foreground rounded-md text-xs">Personal</span>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyPerformanceReport;

