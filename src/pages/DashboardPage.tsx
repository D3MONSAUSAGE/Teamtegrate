
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { Plus, RefreshCw } from 'lucide-react';
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

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, projects, dailyScore, refreshProjects, refreshTasks, isLoading } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();
  
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
        await Promise.all([
          refreshProjects(),
          refreshTasks()
        ]);
      } catch (error) {
        console.error("Error refreshing dashboard data:", error);
      }
    };
    
    refreshAllData();
  }, []);
  
  const handleRefreshData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshProjects(),
        refreshTasks()
      ]);
      toast.success("Dashboard data refreshed");
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
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
              onClick={handleRefreshData}
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
        
        <TasksSummary 
          dailyScore={dailyScore}
          todaysTasks={todaysTasks}
          upcomingTasks={upcomingTasks}
          isLoading={isLoading}
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
      />
    </div>
  );
};

export default DashboardPage;
