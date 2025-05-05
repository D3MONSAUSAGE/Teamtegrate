import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import { format } from 'date-fns';
import TasksSummary from '@/components/dashboard/TasksSummary';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import TeamManagement from '@/components/dashboard/TeamManagement';
import { useIsMobile } from '@/hooks/use-mobile';
import AnalyticsSection from '@/components/dashboard/AnalyticsSection';
import TimeTracking from '@/components/dashboard/TimeTracking';
import { toast } from '@/components/ui/sonner';
import { getTodaysTasks } from '@/contexts/task/taskFilters';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, projects, dailyScore, refreshProjects, refreshTasks, isLoading } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isMobile = useIsMobile();
  
  console.log('Dashboard render - tasks count:', tasks.length, 'projects count:', projects.length);
  
  // Use our improved date handling function from taskFilters.ts
  const todaysTasks = getTodaysTasks(tasks);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  // For upcoming tasks, exclude today's tasks and only show future tasks within the next week
  const upcomingTasks = tasks.filter((task) => {
    try {
      const taskDate = new Date(task.deadline);
      // Not today's task and within next week
      return !taskDate || !todaysTasks.includes(task) && taskDate >= tomorrow && taskDate <= nextWeek;
    } catch (error) {
      console.error("Error processing task date:", task.id);
      return false;
    }
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  
  const recentProjects = projects.slice(0, 3);
  
  useEffect(() => {
    // Initial refresh when dashboard loads
    const refreshAllData = async () => {
      try {
        console.log('Dashboard - Initial data refresh starting...');
        setIsRefreshing(true);
        setHasError(false);
        
        // Refresh tasks then projects
        try {
          await refreshTasks();
          console.log('Tasks refreshed successfully');
        } catch (error) {
          console.error('Error refreshing tasks:', error);
          setHasError(true);
        }
        
        try {
          await refreshProjects();
          console.log('Projects refreshed successfully');
        } catch (error) {
          console.error('Error refreshing projects:', error);
          setHasError(true);
        }
        
        console.log('Dashboard - Initial data refresh complete');
        
        if (tasks.length === 0 && projects.length === 0) {
          console.warn('No data loaded - both tasks and projects are empty');
        }
      } catch (error) {
        console.error("Error refreshing dashboard data:", error);
        setHasError(true);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    refreshAllData();
  }, []);
  
  const handleRefreshData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setHasError(false);
    try {
      console.log('Manual refresh starting...');
      
      // Refresh tasks then projects
      try {
        await refreshTasks();
        console.log('Tasks refreshed successfully');
      } catch (error) {
        console.error('Error refreshing tasks:', error);
        setHasError(true);
      }
      
      try {
        await refreshProjects();
        console.log('Projects refreshed successfully');
      } catch (error) {
        console.error('Error refreshing projects:', error);
        setHasError(true);
      }
      
      console.log('Manual refresh complete - tasks:', tasks.length, 'projects:', projects.length);
      
      if (hasError) {
        toast.error("Some data couldn't be refreshed due to database errors");
      } else {
        toast.success("Dashboard data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      setHasError(true);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForcefulRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setHasError(false);
    try {
      console.log('Manual forceful refresh starting...');
      
      // Refresh tasks then projects
      try {
        await refreshTasks();
        console.log('Tasks refreshed successfully, count:', tasks.length);
      } catch (error) {
        console.error('Error refreshing tasks:', error);
        setHasError(true);
      }
      
      try {
        await refreshProjects();
        console.log('Projects refreshed successfully, count:', projects.length);
      } catch (error) {
        console.error('Error refreshing projects:', error);
        setHasError(true);
      }
      
      if (hasError) {
        toast.error("Some data couldn't be refreshed due to database errors");
      } else {
        toast.success("Dashboard data refreshed");
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      setHasError(true);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  };

  // Improved handleCreateTask to refresh after task creation
  const handleCreateTask = (project?: Project) => {
    setEditingTask(undefined);
    setSelectedProject(project || null);
    setIsCreateTaskOpen(true);
  };

  // Improved refresh logic with better error handling
  const handleTaskCreated = async () => {
    try {
      console.log("Task created/updated, refreshing data...");
      setIsRefreshing(true);
      
      // Add a small delay to ensure the database has updated
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // First refresh tasks, then projects
      await refreshTasks();
      await refreshProjects();
      
      // Log the tasks count after refresh for debugging
      console.log(`After refresh: ${tasks.length} tasks, Today's tasks: ${todaysTasks.length}`);
      
      toast.success("Tasks refreshed");
    } catch (error) {
      console.error("Error refreshing after task update:", error);
      toast.error("Error refreshing tasks. Try again or reload the page.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewTasks = (project: Project) => {
    console.log("View tasks for project:", project.title);
  };
  
  return (
    <div className="p-2 md:p-6">
      <div className="flex flex-col gap-4 md:gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Welcome, {user?.name}!</h1>
            <p className="text-sm md:text-base text-gray-600">
              {format(new Date(), "EEEE, MMMM d")} · Here's your overview
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              onClick={handleForcefulRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} /> 
              Refresh
            </Button>
            <Button 
              onClick={() => handleCreateTask()} 
              size={isMobile ? "sm" : "default"}
            >
              <Plus className="h-4 w-4 mr-2" /> New Task
            </Button>
          </div>
        </div>
        
        {/* Database status alert */}
        {hasError && (
          <div className="p-4 mb-4 rounded border-red-300 border bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Database connection issues detected</p>
              <p className="text-sm">There may be RLS policy recursion errors in your Supabase project.</p>
            </div>
          </div>
        )}
        
        <TasksSummary 
          dailyScore={dailyScore}
          todaysTasks={todaysTasks}
          upcomingTasks={upcomingTasks}
          isLoading={isLoading}
          onRefresh={handleForcefulRefresh}
        />

        <TimeTracking />

        <AnalyticsSection 
          tasks={tasks} 
          projects={projects}
        />
        
        <DailyTasksSection 
          tasks={todaysTasks}
          onCreateTask={() => handleCreateTask()}
          onEditTask={handleEditTask}
          isLoading={isLoading}
        />
        
        <UpcomingTasksSection 
          tasks={upcomingTasks}
          onCreateTask={() => handleCreateTask()}
          onEditTask={handleEditTask}
          isLoading={isLoading}
        />
        
        {user?.role === 'manager' && (
          <>
            <RecentProjects 
              projects={recentProjects}
              onViewTasks={handleViewTasks}
              onCreateTask={handleCreateTask}
              onRefresh={refreshProjects}
              isLoading={isLoading}
            />
            
            <TeamManagement />
          </>
        )}
      </div>
      
      <CreateTaskDialog 
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen}
        editingTask={editingTask}
        currentProjectId={selectedProject?.id}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

export default DashboardPage;
