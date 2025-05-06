
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';
import { format, isSameDay } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { getTodaysTasks } from '@/contexts/task/taskFilters';

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
  
  // Better implementation of today's tasks using the dedicated helper
  const todaysTasks = useMemo(() => {
    const filtered = getTodaysTasks(tasks);
    console.log('Today\'s tasks count from filters:', filtered.length);
    
    if (filtered.length > 0) {
      console.log('Today\'s task titles:', filtered.map(t => t.title));
      console.log('Today\'s task deadlines:', filtered.map(t => t.deadline instanceof Date ? 
        t.deadline.toISOString() : new Date(t.deadline).toISOString()));
    } else {
      console.log('No tasks found for today');
    }
    
    return filtered;
  }, [tasks]);
  
  // Calculate next week's date for upcoming tasks
  const nextWeek = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }, []);
  
  const upcomingTasks = useMemo(() => {
    // Get tasks due in the next 7 days (excluding today)
    const today = new Date();
    
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      
      const taskDate = new Date(task.deadline);
      
      // Skip today's tasks (they're in todaysTasks)
      if (isSameDay(taskDate, today)) return false;
      
      // Only include tasks within the next week
      const taskDay = new Date(taskDate.setHours(0, 0, 0, 0));
      const todayDay = new Date(today.setHours(0, 0, 0, 0));
      const daysDifference = Math.floor((taskDay.getTime() - todayDay.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysDifference > 0 && daysDifference <= 7;
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [tasks]);
  
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
