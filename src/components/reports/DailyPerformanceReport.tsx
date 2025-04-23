
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTask } from "@/contexts/task/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes, isToday, format } from "date-fns";
import { Timer, FileCheck2, FolderKanban } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <div className="space-y-4">
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
