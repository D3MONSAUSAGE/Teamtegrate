
import { useState, useEffect, useMemo } from 'react';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { startOfDay, isToday, format } from 'date-fns';
import { toast } from '@/components/ui/sonner';

export const useDashboardData = () => {
  const { user } = useAuth();
  const { 
    tasks, 
    projects, 
    dailyScore, 
    refreshProjects, 
    refreshTasks, 
    isLoading 
  } = useTask();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  
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
  
  // Initial data refresh
  useEffect(() => {
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
  
  return {
    user,
    tasks,
    projects,
    dailyScore,
    isLoading,
    isRefreshing,
    hasError,
    todaysTasks,
    upcomingTasks,
    recentProjects,
    editingTask,
    selectedProject,
    isCreateTaskOpen,
    handleRefreshData,
    handleEditTask,
    handleCreateTask,
    handleViewTasks,
    handleCreateTaskDialogChange,
  };
};

export default useDashboardData;
