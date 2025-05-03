
import { useState, useEffect } from "react";
import { useTask } from "@/contexts/task/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes, isWithinInterval, format, startOfWeek, endOfWeek } from "date-fns";
import { Task } from "@/types";

interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
}

interface WeeklyPerformanceData {
  weeklyEntries: TimeEntry[];
  loading: boolean;
  totalMinutes: number;
  totalHours: string;
  completedThisWeek: Task[];
  completedProjectTasks: Task[];
  completedPersonalTasks: Task[];
  weekStart: Date;
  weekEnd: Date;
  formattedDateRange: string;
}

export const useWeeklyPerformance = (): WeeklyPerformanceData => {
  const { tasks } = useTask();
  const { user } = useAuth();

  const [weeklyEntries, setWeeklyEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate date ranges for the current week
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const formattedDateRange = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;

  // Fetch this week's time entries
  useEffect(() => {
    if (!user) return;
    const fetchWeeklyEntries = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("clock_in", weekStart.toISOString())
        .lt("clock_in", new Date(weekEnd.setHours(23, 59, 59)).toISOString())
        .order("clock_in", { ascending: true });

      setWeeklyEntries(data || []);
      setLoading(false);
    };
    fetchWeeklyEntries();
  }, [user, weekStart, weekEnd]);

  // Calculate total tracked minutes for the week
  const totalMinutes = weeklyEntries.reduce((total, entry) => {
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

  // Find this week's completed tasks and project tasks
  const completedThisWeek = tasks.filter(
    t => t.status === "Completed" && 
    (t.completedAt || t.updatedAt) && 
    isWithinInterval(new Date(t.completedAt || t.updatedAt), { 
      start: weekStart, 
      end: new Date(weekEnd.setHours(23, 59, 59)) 
    })
  );
  
  const completedProjectTasks = completedThisWeek.filter(
    t => !!t.projectId
  );
  
  const completedPersonalTasks = completedThisWeek.filter(
    t => !t.projectId
  );

  return {
    weeklyEntries,
    loading,
    totalMinutes,
    totalHours,
    completedThisWeek,
    completedProjectTasks,
    completedPersonalTasks,
    weekStart,
    weekEnd,
    formattedDateRange
  };
};
