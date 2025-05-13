
import { useState, useEffect } from "react";
import { useTask } from "@/contexts/task/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMinutes, isWithinInterval, format, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";

interface TimeEntry {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
}

export const useDailyPerformance = () => {
  const { tasks } = useTask();
  const { user } = useAuth();

  const [dailyEntries, setDailyEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Get today's date range
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);
  
  const formattedDate = format(today, "MMM d, yyyy");

  // Fetch today's time entries
  useEffect(() => {
    if (!user) return;
    const fetchDailyEntries = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("clock_in", dayStart.toISOString())
        .lt("clock_in", dayEnd.toISOString())
        .order("clock_in", { ascending: true });

      setDailyEntries(data || []);
      setLoading(false);
    };
    fetchDailyEntries();
  }, [user]);

  // Calculate total tracked minutes for today
  const totalMinutes = dailyEntries.reduce((total, entry) => {
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

  // Find today's completed tasks
  const completedToday = tasks.filter(
    t => t.status === "Completed" && 
    t.updatedAt && 
    isWithinInterval(new Date(t.updatedAt), { 
      start: dayStart, 
      end: dayEnd 
    })
  );
  
  const completedProjectTasks = completedToday.filter(
    t => !!t.projectId
  );
  
  const completedPersonalTasks = completedToday.filter(
    t => !t.projectId
  );

  return {
    totalHours,
    loading,
    completedToday,
    completedProjectTasks,
    completedPersonalTasks,
    dayStart,
    dayEnd,
    formattedDate
  };
};
