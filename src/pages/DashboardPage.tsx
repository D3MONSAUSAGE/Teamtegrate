
import React, { useEffect, useState, useCallback } from 'react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import TasksSummary from '@/components/dashboard/TasksSummary';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { getTodaysTasks } from '@/contexts/task/taskFilters';
import { toast } from '@/components/ui/sonner';

const DashboardPage = () => {
  const { tasks, projects, dailyScore, refreshTasks, refreshProjects } = useTask();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [dataLoadStarted, setDataLoadStarted] = useState(false);
  
  // Calculate today's and upcoming tasks
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      console.log('No tasks available for dashboard calculations');
      setTodaysTasks([]);
      setUpcomingTasks([]);
      return;
    }
    
    try {
      console.log(`Calculating dashboard tasks from ${tasks.length} total tasks`);
      
      // Get today's tasks using the fixed filter function
      const today = getTodaysTasks(tasks);
      console.log(`Dashboard: getTodaysTasks returned ${today.length} tasks`);
      
      // Calculate upcoming tasks (next 7 days, excluding today)
      const now = new Date();
      const startOfToday = startOfDay(now);
      const endOfToday = endOfDay(now);
      const nextWeek = addDays(now, 7);
      
      // For debugging
      console.log(`Upcoming date range: ${endOfToday.toISOString()} to ${nextWeek.toISOString()}`);
      
      const upcoming = tasks.filter(task => {
        if (!task.deadline) return false;
        
        try {
          let taskDate: Date;
          
          if (task.deadline instanceof Date) {
            taskDate = task.deadline;
          } else if (typeof task.deadline === 'string') {
            taskDate = new Date(task.deadline);
          } else {
            return false;
          }
          
          // Skip invalid dates
          if (isNaN(taskDate.getTime())) {
            console.log(`Skipping task with invalid date: ${task.title}`);
            return false;
          }
          
          // Include tasks after today but within the next 7 days
          const isUpcoming = (taskDate > endOfToday) && (taskDate <= nextWeek);
          return isUpcoming;
        } catch (error) {
          console.error(`Error processing upcoming task "${task.title}":`, error);
          return false;
        }
      });
      
      console.log(`Dashboard found ${upcoming.length} upcoming tasks`);
      
      // Update state with today's and upcoming tasks
      setTodaysTasks(today);
      setUpcomingTasks(upcoming);
    } catch (error) {
      console.error("Error calculating tasks for dashboard:", error);
      // Provide defaults in case of error
      setTodaysTasks([]);
      setUpcomingTasks([]);
    }
  }, [tasks]);
  
  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      // Prevent multiple load attempts
      if (dataLoadStarted) return;
      setDataLoadStarted(true);
      
      setIsLoading(true);
      try {
        console.log("Dashboard: Starting initial data load");
        await Promise.all([
          refreshTasks(),
          refreshProjects()
        ]);
        console.log("Dashboard: Initial data loaded successfully");
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error("Failed to load dashboard data");
        
        // Auto-retry logic (max 3 attempts with exponential backoff)
        if (retryCount < 3) {
          const nextRetry = retryCount + 1;
          const delayMs = 1000 * Math.pow(2, retryCount);
          
          console.log(`Auto-retrying dashboard data load (${nextRetry}/3) after ${delayMs}ms`);
          setRetryCount(nextRetry);
          
          // Schedule retry
          setTimeout(() => {
            setDataLoadStarted(false); // Allow retry
          }, delayMs);
        } else {
          console.error("Dashboard data load failed after multiple attempts");
          setIsLoading(false);
        }
      }
    };
    
    loadData();
  }, [refreshTasks, refreshProjects, retryCount, dataLoadStarted]);
  
  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    // Prevent multiple refreshes at once
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log("Dashboard: Manual refresh started");
      await Promise.all([
        refreshTasks(),
        refreshProjects()
      ]);
      console.log(`After refresh: ${tasks.length} tasks, Today's tasks: ${todaysTasks.length}`);
      toast.success("Dashboard refreshed");
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      toast.error("Failed to refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshTasks, refreshProjects, tasks.length, todaysTasks.length, isRefreshing]);
  
  // Handlers for task operations (to be passed to child components)
  const handleCreateTask = () => {
    // Placeholder for task creation function
  };
  
  const handleEditTask = (task: Task) => {
    // Placeholder for task editing function
  };
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      
      <TasksSummary 
        dailyScore={dailyScore}
        todaysTasks={todaysTasks}
        upcomingTasks={upcomingTasks}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
      
      <DailyTasksSection
        tasks={todaysTasks}
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
        isLoading={isLoading}
      />
      
      <UpcomingTasksSection
        tasks={upcomingTasks}
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardPage;
