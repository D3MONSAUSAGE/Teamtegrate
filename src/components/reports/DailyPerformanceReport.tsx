
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
    t => t.status === "Done" && isToday(t.updated_at)
  );
  const completedProjectTasks = completedToday.filter(
    t => !!t.project_id
  );
  const completedPersonalTasks = completedToday.filter(
    t => !t.project_id
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
      const time = task.updated_at ? format(new Date(task.updated_at), "p") : "-";
      const type = task.project_id ? "Project" : "Personal";
      csv.push([time, task.title, type]);
    });
    // Join and export file
    const csvContent = csv.map(row => row.map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `daily-performance-${dateStr}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Performance Report</h2>
        <Button onClick={exportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Tracked</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}</div>
            <p className="text-xs text-muted-foreground">
              {todayEntries.length} time entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <FileCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedPersonalTasks.length} personal, {completedProjectTasks.length} project
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Tasks</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjectTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Project contributions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Completed Today */}
      {completedToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedToday.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      {task.updated_at ? format(new Date(task.updated_at), "h:mm a") : "-"}
                    </TableCell>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      {task.project_id ? "Project" : "Personal"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Time Tracking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : todayEntries.length === 0 ? (
            <p className="text-muted-foreground">No time entries for today</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {format(new Date(entry.clock_in), "h:mm a")}
                    </TableCell>
                    <TableCell>
                      {entry.clock_out ? format(new Date(entry.clock_out), "h:mm a") : "Active"}
                    </TableCell>
                    <TableCell>
                      {entry.duration_minutes
                        ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m`
                        : entry.clock_out
                        ? `${Math.floor(differenceInMinutes(new Date(entry.clock_out), new Date(entry.clock_in)) / 60)}h ${differenceInMinutes(new Date(entry.clock_out), new Date(entry.clock_in)) % 60}m`
                        : "In progress"
                      }
                    </TableCell>
                    <TableCell>{entry.notes || "-"}</TableCell>
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
