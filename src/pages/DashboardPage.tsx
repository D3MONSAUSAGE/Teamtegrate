
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

const DashboardPage = () => {
  const { tasks, projects, dailyScore, refreshTasks, refreshProjects } = useTask();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  
  // Calculate today's and upcoming tasks properly
  useEffect(() => {
    const calculateTasks = () => {
      // Get today's tasks using the fixed filter function
      const today = getTodaysTasks(tasks);
      
      // Calculate upcoming tasks (next 7 days, excluding today)
      const now = new Date();
      const startOfToday = startOfDay(now);
      const endOfToday = endOfDay(now);
      const nextWeek = addDays(now, 7);
      
      const upcoming = tasks.filter(task => {
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
    };
    
    calculateTasks();
  }, [tasks]);
  
  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await refreshTasks();
        await refreshProjects();
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [refreshTasks, refreshProjects]);
  
  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshTasks();
      await refreshProjects();
      console.log(`After refresh: ${tasks.length} tasks, Today's tasks: ${todaysTasks.length}`);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
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
  
  console.log(`Dashboard render - tasks count: ${tasks.length} projects count: ${projects.length}`);
  
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
