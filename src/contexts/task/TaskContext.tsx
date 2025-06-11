
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Project, DailyScore, TaskStatus, TaskComment, ProjectStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTasks } from './api/taskFetch';
import { addTask } from './api/taskCreate';
import { updateTask } from './api/taskUpdate';
import { deleteTask } from './api/taskDelete';
import { assignTaskToProject, assignTaskToUser } from './api/taskAssignment';
import { addProject } from './api/projects';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  dailyScore: DailyScore;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setDailyScore: React.Dispatch<React.SetStateAction<DailyScore>>;
  refreshTasks: () => Promise<void>;
  isLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  assignTaskToProject: (taskId: string, projectId: string) => Promise<void>;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => Promise<Project | null>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  addCommentToTask: (taskId: string, comment: { userId: string; userName: string; text: string }) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyScore, setDailyScore] = useState<DailyScore>({
    completedTasks: 0,
    totalTasks: 0,
    percentage: 0,
    date: new Date(),
  });

  const refreshTasks = async () => {
    if (!user || !user.organization_id) {
      console.log('User or organization not ready for task fetch');
      return;
    }

    setIsLoading(true);
    try {
      const simpleUser = {
        id: user.id,
        organization_id: user.organization_id
      };
      await fetchTasks(simpleUser, setTasks);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProjects = async () => {
    if (!user?.organization_id) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', user.organization_id);

      if (error) throw error;

      const transformedProjects: Project[] = data.map((project: any) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        startDate: new Date(project.start_date),
        endDate: new Date(project.end_date),
        managerId: project.manager_id,
        budget: project.budget || 0,
        budgetSpent: project.budget_spent || 0,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
        tasks: tasks.filter(task => task.projectId === project.id),
        teamMembers: project.team_members || [],
        is_completed: project.is_completed,
        status: (project.status as ProjectStatus) || 'To Do',
        tasks_count: project.tasks_count || 0,
        tags: project.tags || [],
        organizationId: user.organization_id
      }));

      setProjects(transformedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const simpleUser = { id: user.id, organization_id: user.organization_id };
    await addTask(task, simpleUser, tasks, setTasks, projects, setProjects);
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    const simpleUser = { id: user.id, organization_id: user.organization_id };
    await updateTask(taskId, updates, simpleUser, tasks, setTasks, projects, setProjects);
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!user) return;
    await handleUpdateTask(taskId, { status });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    const simpleUser = { id: user.id, organization_id: user.organization_id };
    await deleteTask(taskId, simpleUser, tasks, setTasks, projects, setProjects);
  };

  const handleAssignTaskToProject = async (taskId: string, projectId: string) => {
    if (!user) return;
    const simpleUser = { id: user.id, organization_id: user.organization_id };
    await assignTaskToProject(taskId, projectId, simpleUser, tasks, setTasks, projects, setProjects);
  };

  const handleAssignTaskToUser = async (taskId: string, userId: string, userName: string) => {
    if (!user) return;
    const simpleUser = { id: user.id, organization_id: user.organization_id };
    await assignTaskToUser(taskId, userId, userName, simpleUser, tasks, setTasks, projects, setProjects);
  };

  const handleAddProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    if (!user) return null;
    const simpleUser = { id: user.id, organization_id: user.organization_id };
    const newProject = await addProject(project, simpleUser);
    if (newProject) {
      setProjects(prev => [...prev, newProject]);
    }
    return newProject;
  };

  const handleUpdateProject = async (projectId: string, updates: Partial<Project>) => {
    if (!user?.organization_id) return;

    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.is_completed !== undefined) updateData.is_completed = updates.is_completed;
      if (updates.budget !== undefined) updateData.budget = updates.budget;

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .eq('organization_id', user.organization_id);

      if (error) throw error;

      setProjects(prev => prev.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      ));

      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user?.organization_id) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('organization_id', user.organization_id);

      if (error) throw error;

      setProjects(prev => prev.filter(project => project.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleAddCommentToTask = async (taskId: string, comment: { userId: string; userName: string; text: string }) => {
    if (!user?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          user_id: comment.userId,
          content: comment.text,
          organization_id: user.organization_id
        })
        .select()
        .single();

      if (error) throw error;

      const newComment: TaskComment = {
        id: data.id,
        userId: comment.userId,
        userName: comment.userName,
        text: comment.text,
        createdAt: new Date(data.created_at)
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

  useEffect(() => {
    const initializeTasks = async () => {
      console.log('TaskProvider: Auth loading:', authLoading, 'User:', !!user, 'Org ID:', user?.organization_id);
      
      if (authLoading) {
        console.log('TaskProvider: Still loading auth, waiting...');
        return;
      }

      if (!user) {
        console.log('TaskProvider: No user, setting loading to false');
        setIsLoading(false);
        return;
      }

      if (!user.organization_id) {
        console.log('TaskProvider: User has no organization_id, cannot fetch tasks');
        setIsLoading(false);
        return;
      }

      console.log('TaskProvider: Ready to fetch tasks for user:', user.id);
      await refreshTasks();
      await refreshProjects();
    };

    initializeTasks();
  }, [user, authLoading]);

  const value: TaskContextType = {
    tasks,
    projects,
    dailyScore,
    setTasks,
    setProjects,
    setDailyScore,
    refreshTasks,
    refreshProjects,
    isLoading,
    addTask: handleAddTask,
    updateTask: handleUpdateTask,
    updateTaskStatus: handleUpdateTaskStatus,
    deleteTask: handleDeleteTask,
    assignTaskToProject: handleAssignTaskToProject,
    assignTaskToUser: handleAssignTaskToUser,
    addProject: handleAddProject,
    updateProject: handleUpdateProject,
    deleteProject: handleDeleteProject,
    addCommentToTask: handleAddCommentToTask,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
