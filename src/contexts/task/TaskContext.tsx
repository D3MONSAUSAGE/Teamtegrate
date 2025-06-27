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
  const { user } = useAuth();
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
    if (!user) return;
    setLoading(true);
    try {
      const newTask = await createTaskAPI({ ...task, organizationId: user.organizationId || '' });
      setTasks(prevTasks => [...prevTasks, newTask]);
      toast.success('Task created successfully');
      return newTask;
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    setLoading(true);
    try {
      await updateTaskAPI(taskId, task);
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === taskId ? { ...t, ...task, updatedAt: new Date() } : t))
      );
      toast.success('Task updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    console.log('🎯 TaskContext.deleteTask called', { taskId });
    console.log('🔗 User context:', { userId: user?.id, orgId: user?.organizationId });
    
    setLoading(true);
    try {
      await deleteTaskAPI(taskId);
      
      // Update local state after successful API call
      setTasks(prevTasks => {
        const filteredTasks = prevTasks.filter(task => task.id !== taskId);
        console.log(`Removed task from local tasks. Before: ${prevTasks.length}, After: ${filteredTasks.length}`);
        return filteredTasks;
      });

      // Invalidate React Query caches to force UI refresh
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      
      toast.success('Task deleted successfully');
      console.log('✅ TaskContext.deleteTask completed successfully');
    } catch (err: any) {
      console.error('❌ Error in TaskContext.deleteTask:', err);
      setError(err.message || 'Failed to delete task');
      toast.error('Failed to delete task');
      throw err; // Re-throw to let calling code handle it
    } finally {
      setLoading(false);
    }
  }, [user, queryClient]);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']): Promise<void> => {
    console.log('🎯 TaskContext.updateTaskStatus called', { taskId, status });
    console.log('🔗 User context:', { userId: user?.id, orgId: user?.organizationId });
    
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

      // Invalidate React Query caches to force UI refresh
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['personal-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      
      console.log('✅ TaskContext.updateTaskStatus completed successfully');
    } catch (err: any) {
      console.error('❌ Error in TaskContext.updateTaskStatus:', err);
      setError(err.message || 'Failed to update task status');
      toast.error('Failed to update task status');
      throw err; // Re-throw to let calling code handle it
    } finally {
      setLoading(false);
    }
  }, [user, queryClient]);

  const assignTaskToUser = useCallback(async (taskId: string, userId: string, userName: string) => {
    setLoading(true);
    try {
      await assignTaskToUserAPI(taskId, userId, userName);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, assignedToId: userId, assignedToName: userName, updatedAt: new Date() } : task
        )
      );
      toast.success('Task assigned successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
      toast.error('Failed to assign task');
    } finally {
      setLoading(false);
    }
  }, []);

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
