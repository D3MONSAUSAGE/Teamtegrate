import React, { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Task, Project, DailyScore } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createTask as createTaskAPI, 
  fetchTasks as fetchTasksAPI, 
  updateTask as updateTaskAPI, 
  deleteTask as deleteTaskAPI, 
  assignTaskToUser as assignTaskToUserAPI, 
  fetchProjects as fetchProjectsAPI, 
  createProject as createProjectAPI, 
  updateProject as updateProjectAPI, 
  deleteProject as deleteProjectAPI, 
  fetchTeamPerformance 
} from './api';
import { updateTaskStatus as updateTaskStatusAPI } from './operations/taskStatus';
import { addTaskComment as addTaskCommentAPI } from './api/comments';
import { toast } from 'sonner';
import { addProjectComment, fetchProjectComments } from './api/comments';
import { TaskContextType } from './index';

export const TaskContext = React.createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isReady } = useAuth();
  const queryClient = useQueryClient();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [dailyScore, setDailyScore] = useState<DailyScore>({ 
    completedTasks: 0, 
    totalTasks: 0, 
    percentage: 0, 
    date: new Date()
  });

  // Helper function to invalidate all task-related caches
  const invalidateAllTaskCaches = useCallback(async () => {
    const cacheKeys = [
      ['tasks'],
      ['personal-tasks'],
      ['tasks-my-tasks'],
      ['project-tasks'],
      ['personal-tasks', user?.organizationId, user?.id],
      ['tasks-my-tasks', user?.organizationId, user?.id]
    ];

    await Promise.all(
      cacheKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
    );
  }, [queryClient, user?.organizationId, user?.id]);

  // Enhanced user validation with better error messages
  const validateUserContext = () => {
    if (!user) {
      toast.error('Please sign in to continue');
      throw new Error('User not authenticated');
    }
    if (!user.organizationId) {
      toast.error('Organization data not loaded. Please wait or refresh the page.');
      throw new Error('User organization not loaded');
    }
    if (!isReady) {
      toast.error('Please wait for your profile to load completely');
      throw new Error('User profile not ready');
    }
  };

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setIsLoading(true);
    try {
      const fetchedTasks = await fetchTasksAPI(user.organizationId || '');
      setTasks(fetchedTasks);
      calculateDailyScore(fetchedTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [user]);

  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  const calculateDailyScore = (tasks: Task[]) => {
    if (!user) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter tasks that are due today
    const todaysTasks = tasks.filter((task) => {
      const taskDate = new Date(task.deadline);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    // Count completed tasks from today's due tasks
    const completedToday = todaysTasks.filter((task) => task.status === 'Completed').length;
    const totalTasksToday = todaysTasks.length;
    
    setDailyScore({
      completedTasks: completedToday,
      totalTasks: totalTasksToday,
      percentage: totalTasksToday > 0 ? Math.round((completedToday / totalTasksToday) * 100) : 0,
      date: new Date()
    });
  };

  const createTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | undefined> => {
    console.log('TaskContext.createTask: Starting task creation');
    
    try {
      validateUserContext();
      console.log('TaskContext.createTask: User validation passed');
    } catch (error) {
      console.error('TaskContext.createTask: User validation failed:', error);
      return;
    }

    setLoading(true);
    try {
      console.log('TaskContext.createTask: Calling API with organizationId:', user.organizationId);
      const newTask = await createTaskAPI({ ...task, organizationId: user.organizationId || '' });
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      // Invalidate all task-related caches
      await invalidateAllTaskCaches();
      
      console.log('TaskContext.createTask: Task created successfully');
      return newTask;
    } catch (err: any) {
      console.error('TaskContext.createTask: API error:', err);
      setError(err.message || 'Failed to create task');
      
      // More specific error messages
      if (err.message?.includes('organization')) {
        toast.error('Organization access error. Please refresh and try again.');
      } else if (err.message?.includes('authentication')) {
        toast.error('Authentication error. Please sign in again.');
      } else {
        toast.error('Failed to create task. Please try again.');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, isReady, invalidateAllTaskCaches]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | undefined> => {
    if (!user) return;
    
    const newTask: Task = { 
      ...task, 
      id: Date.now().toString(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    return newTask;
  }, [user]);

  const updateTask = useCallback(async (taskId: string, task: Partial<Task>) => {
    try {
      validateUserContext();
    } catch (error) {
      console.error('TaskContext.updateTask: User validation failed:', error);
      return;
    }

    setLoading(true);
    try {
      await updateTaskAPI(taskId, task);
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === taskId ? { ...t, ...task, updatedAt: new Date() } : t))
      );
      
      // Invalidate all task-related caches
      await invalidateAllTaskCaches();
      
      toast.success('Task updated successfully');
    } catch (err: any) {
      console.error('TaskContext.updateTask: API error:', err);
      setError(err.message || 'Failed to update task');
      toast.error('Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isReady, invalidateAllTaskCaches]);

  const deleteTask = useCallback(async (taskId: string) => {
    console.log('🎯 TaskContext.deleteTask called', { taskId });
    
    try {
      validateUserContext();
    } catch (error) {
      console.error('TaskContext.deleteTask: User validation failed:', error);
      return;
    }
    
    setLoading(true);
    try {
      await deleteTaskAPI(taskId);
      
      // Update local state after successful API call
      setTasks(prevTasks => {
        const filteredTasks = prevTasks.filter(task => task.id !== taskId);
        console.log(`Removed task from local tasks. Before: ${prevTasks.length}, After: ${filteredTasks.length}`);
        return filteredTasks;
      });

      // Invalidate all task-related caches
      await invalidateAllTaskCaches();
      
      toast.success('Task deleted successfully');
      console.log('✅ TaskContext.deleteTask completed successfully');
    } catch (err: any) {
      console.error('❌ Error in TaskContext.deleteTask:', err);
      setError(err.message || 'Failed to delete task');
      toast.error('Failed to delete task. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isReady, invalidateAllTaskCaches]);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']): Promise<void> => {
    console.log('🎯 TaskContext.updateTaskStatus called', { taskId, status });
    
    try {
      validateUserContext();
    } catch (error) {
      console.error('TaskContext.updateTaskStatus: User validation failed:', error);
      return;
    }
    
    setLoading(true);
    try {
      // Use the simplified API function with correct user context
      await updateTaskStatusAPI(
        taskId, 
        status, 
        { 
          id: user?.id, 
          organizationId: user?.organizationId 
        }
      );
      
      // Update local state after successful API call
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId 
            ? { 
                ...task, 
                status: status, 
                updatedAt: new Date(),
                completedAt: status === 'Completed' ? new Date() : task.completedAt
              } 
            : task
        )
      );

      // Invalidate all task-related caches
      await invalidateAllTaskCaches();
      
      console.log('✅ TaskContext.updateTaskStatus completed successfully');
    } catch (err: any) {
      console.error('❌ Error in TaskContext.updateTaskStatus:', err);
      setError(err.message || 'Failed to update task status');
      toast.error('Failed to update task status. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, isReady, invalidateAllTaskCaches]);

  const assignTaskToUser = useCallback(async (taskId: string, userId: string, userName: string) => {
    try {
      validateUserContext();
    } catch (error) {
      console.error('TaskContext.assignTaskToUser: User validation failed:', error);
      return;
    }

    setLoading(true);
    try {
      await assignTaskToUserAPI(taskId, userId, userName);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, assignedToId: userId, assignedToName: userName, updatedAt: new Date() } : task
        )
      );
      
      // Invalidate all task-related caches
      await invalidateAllTaskCaches();
      
      toast.success('Task assigned successfully');
    } catch (err: any) {
      console.error('TaskContext.assignTaskToUser: API error:', err);
      setError(err.message || 'Failed to assign task');
      toast.error('Failed to assign task. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isReady, invalidateAllTaskCaches]);

  const addCommentToTask = useCallback(async (taskId: string, commentText: string) => {
    if (!user) return;
    
    try {
      const newComment = await addTaskCommentAPI(taskId, {
        userId: user.id,
        userName: user.name,
        text: commentText,
        organizationId: user.organizationId || ''
      });

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                comments: [...(task.comments || []), newComment],
                updatedAt: new Date()
              }
            : task
        )
      );

      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment to task:', error);
      toast.error('Failed to add comment');
    }
  }, [user]);

  const addCommentToProject = async (projectId: string, commentText: string) => {
    if (!user) return;
    
    try {
      const { addProjectComment } = await import('@/contexts/task/api/comments');
      const newComment = await addProjectComment(projectId, {
        userId: user.id,
        userName: user.name,
        text: commentText,
        organizationId: user.organizationId || ''
      });

      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { 
                ...project, 
                comments: [newComment, ...(project.comments || [])]
              }
            : project
        )
      );

      toast.success('Project update added successfully');
    } catch (error) {
      console.error('Error adding project comment:', error);
      toast.error('Failed to add project update');
    }
  };

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setProjectsLoading(true);
    try {
      const fetchedProjects = await fetchProjectsAPI(user.organizationId || '');
      const projectsWithComments = fetchedProjects.map(project => ({
        ...project,
        comments: project.comments || []
      }));
      setProjects(projectsWithComments);
    } catch (err: any) {
      setProjectsError(err.message || 'Failed to fetch projects');
    } finally {
      setProjectsLoading(false);
    }
  }, [user]);

  const refreshProjects = useCallback(async () => {
    if (!user) return;
    try {
      const fetchedProjects = await fetchProjectsAPI(user.organizationId || '');
      const projectsWithComments = fetchedProjects.map(project => ({
        ...project,
        comments: project.comments || []
      }));
      setProjects(projectsWithComments);
    } catch (err: any) {
      setProjectsError(err.message || 'Failed to refresh projects');
    }
  }, [user]);

  const createProject = useCallback(async (title: string, description?: string, startDate?: string, endDate?: string, budget?: number) => {
    if (!user) return;
    setProjectsLoading(true);
    try {
      const newProject = await createProjectAPI({
        title,
        description,
        startDate,
        endDate,
        budget,
        organizationId: user.organizationId || ''
      });
      setProjects(prevProjects => [...prevProjects, newProject]);
      toast.success('Project created successfully');
      return newProject;
    } catch (err: any) {
      setProjectsError(err.message || 'Failed to create project');
      toast.error('Failed to create project');
    } finally {
      setProjectsLoading(false);
    }
  }, [user]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    setProjectsLoading(true);
    try {
      await updateProjectAPI(projectId, updates);
      setProjects(prevProjects =>
        prevProjects.map(project => (project.id === projectId ? { ...project, ...updates } : project))
      );
      toast.success('Project updated successfully');
    } catch (err: any) {
      setProjectsError(err.message || 'Failed to update project');
      toast.error('Failed to update project');
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    setProjectsLoading(true);
    try {
      await deleteProjectAPI(projectId);
      setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (err: any) {
      setProjectsError(err.message || 'Failed to delete project');
      toast.error('Failed to delete project');
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchProjects();
    }
  }, [user, fetchTasks, fetchProjects]);

  const value: TaskContextType = {
    tasks,
    loading,
    isLoading,
    error,
    fetchTasks,
    refreshTasks,
    createTask,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTaskToUser,
    addCommentToTask,
    addCommentToProject,
    dailyScore,
    projects,
    projectsLoading,
    projectsError,
    fetchProjects,
    refreshProjects,
    createProject,
    updateProject,
    deleteProject,
    setProjects
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTask = () => {
  const context = React.useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
