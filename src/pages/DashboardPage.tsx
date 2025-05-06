import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';
import TasksSummary from '@/components/dashboard/TasksSummary';
import DailyTasksSection from '@/components/dashboard/DailyTasksSection';
import UpcomingTasksSection from '@/components/dashboard/UpcomingTasksSection';
import RecentProjects from '@/components/dashboard/RecentProjects';
import TeamManagement from '@/components/dashboard/TeamManagement';
import { useIsMobile } from '@/hooks/use-mobile';
import AnalyticsSection from '@/components/dashboard/AnalyticsSection';
import TimeTracking from '@/components/dashboard/TimeTracking';
import { toast } from '@/components/ui/sonner';

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
  
  // Calculate today's date once
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  
  // Memoize tomorrow's date
  const tomorrow = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return date;
  }, [today]);

  // Memoize next week's date
  const nextWeek = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 7);
    return date;
  }, [today]);
  
  // Improved task filtering logic with better debugging
  const todaysTasks = useMemo(() => {
    console.log('Filtering tasks for today, total tasks:', tasks.length);
    
    // Create today date object at midnight for better comparison
    const todayStart = startOfDay(new Date());
    
    return tasks.filter((task) => {
      if (!task.deadline) {
        return false;
      }
      
      // Convert to date object if it's a string
      const deadlineDate = new Date(task.deadline);
      const result = isToday(deadlineDate);
      
      if (result) {
        console.log(`Task "${task.title}" (${task.id}) matched today's date:`, format(deadlineDate, 'yyyy-MM-dd'));
      }
      
      return result;
    });
  }, [tasks]);
  
  const upcomingTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate > today && taskDate <= nextWeek;
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [tasks, today, nextWeek]);
  
  const recentProjects = useMemo(() => {
    return projects.slice(0, 3);
  }, [projects]);
  
  // Debug log for today's tasks with more detail
  useEffect(() => {
    if (todaysTasks.length > 0) {
      console.log('Today\'s task details:', todaysTasks.map(t => ({
        id: t.id,
        title: t.title,
        deadline: t.deadline ? format(new Date(t.deadline), 'yyyy-MM-dd') : 'no deadline',
        status: t.status,
        userId: t.userId
      })));
    } else {
      console.log('No tasks found for today');
    }
  }, [todaysTasks]);
  
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

  const handleCreateTask = (project?: Project) => {
    setEditingTask(undefined);
    setSelectedProject(project || null);
    setIsCreateTaskOpen(true);
  };

  const handleViewTasks = (project: Project) => {
    console.log("View tasks for project:", project.title);
  };
  
  // When create task dialog closes, refresh tasks to ensure all data is up to date
  const handleCreateTaskDialogChange = (open: boolean) => {
    setIsCreateTaskOpen(open);
    if (!open) {
      // Dialog was closed, refresh tasks after a short delay
      setTimeout(() => {
        refreshTasks().then(() => {
          console.log('Tasks refreshed after dialog closed');
        });
      }, 500);
    }
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
          onRefresh={refreshTasks}
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
        onOpenChange={handleCreateTaskDialogChange}
        editingTask={editingTask}
        currentProjectId={selectedProject?.id}
      />
    </div>
  );
};

export default DashboardPage;
