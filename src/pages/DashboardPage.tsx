
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, RefreshCw, AlertTriangle, LayoutDashboard } from 'lucide-react';
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
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todaysTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingTasks = tasks.filter((task) => {
    const taskDate = new Date(task.deadline);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate > today && taskDate <= nextWeek;
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

  const handleCreateTask = (project?: Project) => {
    setEditingTask(undefined);
    setSelectedProject(project || null);
    setIsCreateTaskOpen(true);
  };

  const handleViewTasks = (project: Project) => {
    console.log("View tasks for project:", project.title);
  };
  
  return (
    <div className="p-2 md:p-6 bg-background/40 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:gap-6 animate-fade-in">
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl md:text-2xl font-bold text-foreground">Welcome, {user?.name}!</CardTitle>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {format(new Date(), "EEEE, MMMM d, yyyy")} · Here's your overview
                  </p>
                </div>
              </div>
              <div className="flex gap-2 self-start sm:self-auto">
                <Button 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  onClick={handleForcefulRefresh}
                  disabled={isRefreshing || isLoading}
                  className="border-slate-200 dark:border-slate-700 hover:bg-muted/50 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} /> 
                  Refresh
                </Button>
                <Button 
                  onClick={() => handleCreateTask()} 
                  size={isMobile ? "sm" : "default"}
                  className="bg-primary hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" /> New Task
                </Button>
              </div>
            </CardHeader>
          </Card>
          
          {/* Database status alert */}
          {hasError && (
            <div className="p-4 mb-2 rounded-lg border-red-300 border bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 flex items-center gap-3 shadow-sm animate-fade-in">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimeTracking />
            
            <AnalyticsSection 
              tasks={tasks} 
              projects={projects}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
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
          </div>
          
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
        />
      </div>
    </div>
  );
};

export default DashboardPage;
