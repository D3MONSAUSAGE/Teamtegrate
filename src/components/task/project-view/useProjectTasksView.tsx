import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTask } from '@/contexts/task';
import { Task, Project, TaskStatus } from '@/types';
import { toast } from '@/components/ui/sonner';
import { useProjectTasks } from './useProjectTasks';
import { supabase } from '@/integrations/supabase/client';

export const useProjectTasksView = (projectId: string | null) => {
  const { tasks, projects, refreshProjects, updateTaskStatus } = useTask();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  
  // Memoize project data to prevent unnecessary re-renders
  const project = useMemo(() => {
    return projects.find(p => p.id === projectId);
  }, [projects, projectId]);
  
  // Use custom hook for task filtering and sorting - use projectTasks instead of all tasks
  const {
    searchQuery, 
    setSearchQuery,
    sortBy,
    setSortBy,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    progress,
  } = useProjectTasks(projectTasks, projectId);

  // Reset states when project ID changes
  useEffect(() => {
    setRetryCount(0);
    setInitialLoadAttempted(false);
    setIsLoading(true);
    setLoadError(null);
    setProjectTasks([]);
  }, [projectId]);

  // Function to fetch tasks for this specific project
  const fetchProjectTasks = async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Fetching tasks specifically for project ${projectId}`);
      
      // Fetch all tasks belonging to this project regardless of creator or assignee
      const { data: taskData, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);
        
      if (error) {
        console.error('Error fetching project tasks:', error);
        setLoadError('Failed to load project tasks');
        return;
      }
      
      console.log(`Found ${taskData?.length || 0} tasks for project ${projectId}`);
      
      // Process the tasks similar to fetchTasks
      const parseDate = (dateStr: string | null): Date => {
        if (!dateStr) return new Date();
        return new Date(dateStr);
      };
      
      // Get all user IDs that are assigned to tasks to fetch their names
      const assignedUserIds = taskData
        .filter(task => task.assigned_to_id)
        .map(task => task.assigned_to_id);
        
      // Remove duplicates
      const uniqueUserIds = [...new Set(assignedUserIds)];
      
      // Fetch user names for assigned users
      let userMap = new Map();
      if (uniqueUserIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', uniqueUserIds);

        if (userError) {
          console.error('Error fetching user data for task assignments:', userError);
        } else if (userData) {
          userData.forEach(user => {
            userMap.set(user.id, user.name || user.email);
          });
        }
      }
      
      // Map tasks with their assigned user names
      const formattedTasks: Task[] = taskData.map((task) => {
        const assignedUserName = task.assigned_to_id ? userMap.get(task.assigned_to_id) : undefined;

        return {
          id: task.id,
          userId: task.user_id || '',
          projectId: task.project_id,
          title: task.title || '',
          description: task.description || '',
          deadline: parseDate(task.deadline),
          priority: (task.priority as Task['priority']) || 'Medium',
          status: (task.status || 'To Do') as Task['status'],
          createdAt: parseDate(task.created_at),
          updatedAt: parseDate(task.updated_at),
          completedAt: task.completed_at ? parseDate(task.completed_at) : undefined,
          assignedToId: task.assigned_to_id,
          assignedToName: assignedUserName,
          comments: [],
          cost: task.cost || 0
        };
      });
      
      setProjectTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      setLoadError('Failed to load project tasks');
    } finally {
      setIsLoading(false);
      setInitialLoadAttempted(true);
    }
  };
  
  // Initial fetch of project tasks
  useEffect(() => {
    fetchProjectTasks();
  }, [projectId]);

  // Fetch fresh project data when the component mounts or projectId changes
  useEffect(() => {
    // Skip if we've already tried loading or if projectId is null
    if (initialLoadAttempted || !projectId) {
      return;
    }

    const loadData = async () => {
      setLoadError(null);
      
      try {
        console.log(`Loading projects data for project ID: ${projectId}`);
        await refreshProjects();
        console.log(`Successfully loaded projects data`);
        setInitialLoadAttempted(true);
      } catch (error) {
        console.error('Error refreshing project data:', error);
        setLoadError('Failed to load project data. Please try refreshing.');
        
        // Auto-retry logic (maximum 3 attempts with exponential backoff)
        if (retryCount < 3) {
          const delayMs = 1000 * Math.pow(2, retryCount);
          console.log(`Auto-retrying (attempt ${retryCount + 1}) after ${delayMs}ms...`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => loadData(), delayMs);
        } else {
          setInitialLoadAttempted(true);
        }
      }
    };
    
    loadData();
  }, [projectId, refreshProjects, retryCount, initialLoadAttempted]);

  // Handle task status change
  const handleTaskStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    if (!projectId) return;
    
    try {
      console.log(`Updating task ${taskId} status to ${newStatus}`);
      
      // Find the task to update in our local state
      const taskToUpdate = projectTasks.find(task => task.id === taskId);
      if (!taskToUpdate) {
        console.error(`Task ${taskId} not found in project tasks`);
        return;
      }
      
      // Call the updateTaskStatus function from context
      await updateTaskStatus(taskId, newStatus);
      
      // Update local task state to reflect the change immediately
      setProjectTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                status: newStatus, 
                completedAt: newStatus === 'Completed' ? new Date() : undefined 
              } 
            : task
        )
      );
      
      console.log(`Task ${taskId} status updated successfully to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  }, [projectId, projectTasks, updateTaskStatus]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  const handleSortByChange = useCallback((value: string) => {
    setSortBy(value);
  }, [setSortBy]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsCreateTaskOpen(true);
  }, []);

  const handleCreateTask = useCallback(() => {
    setEditingTask(undefined);
    setIsCreateTaskOpen(true);
  }, []);
  
  // Function to handle task dialog completion
  const handleTaskDialogComplete = useCallback(() => {
    // Close the dialog
    setIsCreateTaskOpen(false);
    
    // Refresh the tasks list
    console.log("Task saved, refreshing project tasks...");
    fetchProjectTasks();
  }, []);
  
  const handleManualRefresh = useCallback(async () => {
    if (!projectId) return;
    
    setIsRefreshing(true);
    setLoadError(null);
    
    try {
      await refreshProjects();
      await fetchProjectTasks();
      
      toast.success("Project data refreshed successfully");
    } catch (error) {
      console.error('Error refreshing project data:', error);
      setLoadError('Failed to refresh project data.');
      toast.error("Failed to refresh project data");
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, refreshProjects]);

  return {
    isLoading,
    isRefreshing,
    loadError,
    project,
    searchQuery,
    sortBy,
    todoTasks,
    inProgressTasks,
    pendingTasks,
    completedTasks,
    progress,
    isCreateTaskOpen,
    editingTask,
    setIsCreateTaskOpen,
    handleSearchChange,
    handleEditTask,
    handleCreateTask,
    handleManualRefresh,
    handleTaskStatusChange,
    onSortByChange: handleSortByChange,
    handleTaskDialogComplete
  };
};
