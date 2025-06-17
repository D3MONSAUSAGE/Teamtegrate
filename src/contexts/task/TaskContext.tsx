
import React, { useState, useCallback, useEffect } from 'react';
import { Task, Project, DailyScore } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { createTask as createTaskAPI, fetchTasks as fetchTasksAPI, updateTask as updateTaskAPI, deleteTask as deleteTaskAPI, updateTaskStatus as updateTaskStatusAPI, assignTaskToUser as assignTaskToUserAPI, fetchProjects as fetchProjectsAPI, createProject as createProjectAPI, updateProject as updateProjectAPI, deleteProject as deleteProjectAPI, fetchTeamPerformance, } from './api';
import { addTaskComment as addTaskCommentAPI } from './api/comments';
import { toast } from 'sonner';
import { addProjectComment, fetchProjectComments } from './api/comments';
import { TaskContext, TaskContextType } from './index';

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
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
    try {
      const fetchedTasks = await fetchTasksAPI(user, setTasks);
      // Calculate daily score here after tasks are fetched
      calculateDailyScore(tasks);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [user, tasks]);

  const calculateDailyScore = (tasks: Task[]) => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    const completedToday = todayTasks.filter(task => task.status === 'Completed');
    
    setDailyScore({
      completedTasks: completedToday.length,
      totalTasks: todayTasks.length,
      percentage: todayTasks.length > 0 ? (completedToday.length / todayTasks.length) * 100 : 0,
      date: today
    });
  };

  const createTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    setLoading(true);
    try {
      const newTask = await createTaskAPI({ ...task, organizationId: user.organizationId || '' });
      setTasks(prevTasks => [...prevTasks, newTask]);
      toast.success('Task created successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = { 
      ...task, 
      id: Date.now().toString(), 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  }, []);

  const updateTask = useCallback(async (taskId: string, task: Partial<Task>) => {
    setLoading(true);
    try {
      await updateTaskAPI(taskId, task, user, setTasks, tasks, setProjects, projects);
      toast.success('Task updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  }, [user, tasks, projects]);

  const deleteTask = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      await deleteTaskAPI(taskId, user, tasks, setTasks, projects, setProjects);
      toast.success('Task deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
      toast.error('Failed to delete task');
    } finally {
      setLoading(false);
    }
  }, [user, tasks, projects]);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    setLoading(true);
    try {
      const updates: Partial<Task> = { status };
      if (status === 'Completed') {
        updates.completedAt = new Date();
      }
      await updateTaskStatusAPI(taskId, updates, user, setTasks, tasks, setProjects, projects, status);
      toast.success('Task status updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
      toast.error('Failed to update task status');
    } finally {
      setLoading(false);
    }
  }, [user, tasks, projects]);

  const assignTaskToUser = useCallback(async (taskId: string, userId: string, userName: string) => {
    setLoading(true);
    try {
      await assignTaskToUserAPI(taskId, userId, userName, user, setTasks, tasks, setProjects, projects);
      toast.success('Task assigned successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
      toast.error('Failed to assign task');
    } finally {
      setLoading(false);
    }
  }, [user, tasks, projects]);

  const addCommentToTask = useCallback(async (taskId: string, commentText: string) => {
    if (!user) return;
    
    try {
      const newComment = await addTaskCommentAPI(taskId, {
        userId: user.id,
        userName: user.name || user.email,
        text: commentText,
        organizationId: user.organizationId || ''
      });

      // Optimistically update the task in the local state
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
      const newComment = await addProjectComment(projectId, {
        userId: user.id,
        userName: user.name || user.email,
        text: commentText,
        organizationId: user.organizationId || ''
      });

      // Update projects to include the new comment
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { 
                ...project, 
                comments: [...(project.comments || []), newComment]
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
       // Ensure each project has a comments property
       const projectsWithComments = fetchedProjects.map(project => ({
        ...project,
        comments: project.comments || [] // Initialize comments if undefined
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
      // Ensure each project has a comments property
      const projectsWithComments = fetchedProjects.map(project => ({
        ...project,
        comments: project.comments || [] // Initialize comments if undefined
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
    error,
    fetchTasks,
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
