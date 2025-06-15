
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Task, Project, User, TaskStatus, DailyScore } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedData } from '@/contexts/UnifiedDataContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  isLoading: boolean;
  refreshTasks: () => Promise<void>;
  
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => Promise<void>;
  addCommentToTask: (taskId: string, comment: string) => Promise<void>;
  
  // Projects
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  fetchProjects: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  createProject: (title: string, description?: string, startDate?: string, endDate?: string, budget?: number) => Promise<Project | undefined>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  
  // Daily score
  dailyScore: DailyScore;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

// Add the missing useTask export (alias for useTaskContext)
export const useTask = useTaskContext;

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { tasks: unifiedTasks, projects: unifiedProjects, isLoadingTasks, isLoadingProjects, refetchTasks, refetchProjects } = useUnifiedData();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dailyScore, setDailyScore] = useState<DailyScore>({
    completedTasks: 0,
    totalTasks: 0,
    percentage: 0,
    date: new Date()
  });

  // Sync with unified data
  useEffect(() => {
    setTasks(unifiedTasks);
  }, [unifiedTasks]);

  useEffect(() => {
    setProjects(unifiedProjects);
  }, [unifiedProjects]);

  // Calculate daily score
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    const completed = todayTasks.filter(task => task.status === 'Completed').length;
    const total = todayTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    setDailyScore({
      completedTasks: completed,
      totalTasks: total,
      percentage,
      date: today
    });
  }, [tasks]);

  const refreshTasks = async () => {
    await refetchTasks();
  };

  const refreshProjects = async () => {
    await refetchProjects();
  };

  const fetchProjects = async () => {
    await refetchProjects();
  };

  // Task operations
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    try {
      const newTaskId = crypto.randomUUID();
      const now = new Date();
      
      const { error } = await supabase
        .from('tasks')
        .insert({
          id: newTaskId,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status || 'To Do',
          deadline: taskData.deadline.toISOString(),
          project_id: taskData.projectId,
          assigned_to_id: taskData.assignedToId,
          assigned_to_ids: taskData.assignedToIds || [],
          assigned_to_names: taskData.assignedToNames || [],
          cost: taskData.cost || 0,
          user_id: taskData.userId,
          organization_id: user.organizationId,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        });

      if (error) throw error;

      // Add to local state
      const newTask: Task = {
        ...taskData,
        id: newTaskId,
        createdAt: now,
        updatedAt: now,
        organizationId: user.organizationId
      };
      
      setTasks(prev => [...prev, newTask]);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline.toISOString();
      if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
      if (updates.assignedToId !== undefined) updateData.assigned_to_id = updates.assignedToId;
      if (updates.assignedToIds !== undefined) updateData.assigned_to_ids = updates.assignedToIds;
      if (updates.assignedToNames !== undefined) updateData.assigned_to_names = updates.assignedToNames;
      if (updates.cost !== undefined) updateData.cost = updates.cost;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
      ));
      
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status });
  };

  const assignTaskToUser = async (taskId: string, userId: string, userName: string) => {
    await updateTask(taskId, { 
      assignedToId: userId, 
      assignedToName: userName,
      assignedToIds: [userId],
      assignedToNames: [userName]
    });
  };

  const addCommentToTask = async (taskId: string, comment: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          content: comment,
          user_id: user.id,
          organization_id: user.organizationId
        });

      if (error) throw error;

      // Update local task with new comment
      const newComment = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name || user.email,
        text: comment,
        createdAt: new Date(),
        organizationId: user.organizationId
      };

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, comments: [...(task.comments || []), newComment] }
          : task
      ));

      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Project operations
  const createProject = async (
    title: string, 
    description?: string, 
    startDate?: string, 
    endDate?: string, 
    budget?: number
  ): Promise<Project | undefined> => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    try {
      const projectId = crypto.randomUUID();
      const now = new Date();

      const { error } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          title,
          description: description || '',
          start_date: startDate || now.toISOString().split('T')[0],
          end_date: endDate || now.toISOString().split('T')[0],
          budget: budget || 0,
          budget_spent: 0,
          status: 'To Do',
          organization_id: user.organizationId,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        });

      if (error) throw error;

      const newProject: Project = {
        id: projectId,
        title,
        description: description || '',
        startDate: startDate ? new Date(startDate) : now,
        endDate: endDate ? new Date(endDate) : now,
        status: 'To Do',
        budget: budget || 0,
        budgetSpent: 0,
        managerId: user.id,
        teamMemberIds: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
        isCompleted: false,
        organizationId: user.organizationId,
        tasksCount: 0
      };

      setProjects(prev => [...prev, newProject]);
      toast.success('Project created successfully');
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString().split('T')[0];
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate.toISOString().split('T')[0];
      if (updates.budget !== undefined) updateData.budget = updates.budget;
      if (updates.budgetSpent !== undefined) updateData.budget_spent = updates.budgetSpent;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;
      if (updates.teamMemberIds !== undefined) updateData.team_members = updates.teamMemberIds;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.map(project => 
        project.id === projectId ? { ...project, ...updates, updatedAt: new Date() } : project
      ));
      
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(project => project.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const value = {
    tasks,
    setTasks,
    isLoading: isLoadingTasks,
    refreshTasks,
    
    // Task operations
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTaskToUser,
    addCommentToTask,
    
    // Projects
    projects,
    projectsLoading: isLoadingProjects,
    projectsError: null,
    fetchProjects,
    refreshProjects,
    createProject,
    updateProject,
    deleteProject,
    setProjects,
    
    // Daily score
    dailyScore
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
