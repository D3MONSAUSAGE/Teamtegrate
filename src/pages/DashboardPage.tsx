
import React, { useEffect, useState, useCallback } from 'react';
import { useTask } from '@/contexts/task';
import { Task } from '@/types';
import TasksSummary from '@/components/dashboard/TasksSummary';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { getTodaysTasks } from '@/contexts/task/taskFilters';
import { toast } from '@/components/ui/sonner';

const DashboardPage = () => {
  const { tasks, projects, dailyScore, refreshTasks, refreshProjects } = useTask();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  
  // Calculate today's and upcoming tasks properly
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    
    try {
      // Get today's tasks using the fixed filter function
      const today = getTodaysTasks(tasks);
      
      // Calculate upcoming tasks (next 7 days, excluding today)
      const now = new Date();
      const startOfToday = startOfDay(now);
      const endOfToday = endOfDay(now);
      const nextWeek = addDays(now, 7);
      
      const upcoming = tasks.filter(task => {
        if (!task.deadline) return false;
        
        const taskDate = new Date(task.deadline);
        
        // Skip invalid dates
        if (isNaN(taskDate.getTime())) return false;
        
        // Include tasks after today but within the next 7 days
        return (taskDate > endOfToday) && (taskDate <= nextWeek);
      });
      
      console.log(`Dashboard calculated ${today.length} tasks for today and ${upcoming.length} upcoming tasks`);
      
      // Update state with today's and upcoming tasks
      setTodaysTasks(today);
      setUpcomingTasks(upcoming);
    } catch (error) {
      console.error("Error calculating tasks for dashboard:", error);
    }
  }, [tasks]);
  
  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          refreshTasks(),
          refreshProjects()
        ]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error("Failed to load dashboard data");
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [refreshTasks, refreshProjects]);
  
  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
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
  }, [refreshTasks, refreshProjects, tasks.length, todaysTasks.length]);
  
  // Handlers for task operations
  const handleCreateTask = () => {
    // This function will be passed to child components
  };
  
  const handleEditTask = (task: Task) => {
    // This function will be passed to child components
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
