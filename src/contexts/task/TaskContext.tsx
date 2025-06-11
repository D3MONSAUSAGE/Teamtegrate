
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FlatTask, FlatProject, FlatUser } from '@/types/flat';
import { TaskStatus, TaskComment, ProjectStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchFlatTasks } from './api/flatTaskFetch';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { addOrgIdToInsert, validateUserOrganization } from '@/utils/organizationHelpers';

interface TaskContextType {
  tasks: FlatTask[];
  projects: FlatProject[];
  dailyScore: {
    completedTasks: number;
    totalTasks: number;
    percentage: number;
    date: Date;
  };
  setTasks: React.Dispatch<React.SetStateAction<FlatTask[]>>;
  setProjects: React.Dispatch<React.SetStateAction<FlatProject[]>>;
  setDailyScore: React.Dispatch<React.SetStateAction<{
    completedTasks: number;
    totalTasks: number;
    percentage: number;
    date: Date;
  }>>;
  refreshTasks: () => Promise<void>;
  isLoading: boolean;
  addTask: (task: Omit<FlatTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<FlatTask>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  assignTaskToProject: (taskId: string, projectId: string) => Promise<void>;
  assignTaskToUser: (taskId: string, userId: string, userName: string) => Promise<void>;
  addProject: (project: Omit<FlatProject, 'id' | 'createdAt' | 'updatedAt' | 'teamMemberIds'>) => Promise<FlatProject | null>;
  updateProject: (projectId: string, updates: Partial<FlatProject>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  addCommentToTask: (taskId: string, comment: { userId: string; userName: string; text: string }) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<FlatTask[]>([]);
  const [projects, setProjects] = useState<FlatProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyScore, setDailyScore] = useState<{
    completedTasks: number;
    totalTasks: number;
    percentage: number;
    date: Date;
  }>({
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
      const flatUser: FlatUser = {
        id: user.id,
        email: user.email || '',
        role: ['user', 'manager', 'admin', 'superadmin'].includes(user.role) 
          ? user.role as 'user' | 'manager' | 'admin' | 'superadmin' 
          : 'user',
        organization_id: user.organization_id
      };
      
      await fetchFlatTasks(flatUser, setTasks);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProjects = async () => {
    if (!user?.organization_id) return;
    
    try {
      const projectsQuery = await supabase
        .from('projects')
        .select('id, title, description, start_date, end_date, manager_id, created_at, updated_at, team_members, budget, budget_spent, is_completed, status, tasks_count, tags');

      const projectsResult = projectsQuery as any;

      if (projectsResult.error) throw projectsResult.error;

      const transformedProjects: FlatProject[] = [];
      
      if (projectsResult.data) {
        for (const dbProject of projectsResult.data) {
          let projectStatus: 'To Do' | 'In Progress' | 'Completed' = 'To Do';
          if (dbProject.status === 'To Do' || dbProject.status === 'In Progress' || dbProject.status === 'Completed') {
            projectStatus = dbProject.status;
          }
          
          const flatProject: FlatProject = {
            id: String(dbProject.id),
            title: String(dbProject.title || ''),
            description: dbProject.description ? String(dbProject.description) : undefined,
            startDate: dbProject.start_date ? new Date(dbProject.start_date) : new Date(),
            endDate: dbProject.end_date ? new Date(dbProject.end_date) : new Date(),
            managerId: String(dbProject.manager_id || ''),
            createdAt: dbProject.created_at ? new Date(dbProject.created_at) : new Date(),
            updatedAt: dbProject.updated_at ? new Date(dbProject.updated_at) : new Date(),
            teamMemberIds: Array.isArray(dbProject.team_members) ? dbProject.team_members.map(String) : [],
            budget: Number(dbProject.budget) || 0,
            budgetSpent: Number(dbProject.budget_spent) || 0,
            is_completed: Boolean(dbProject.is_completed),
            status: projectStatus,
            tasks_count: Number(dbProject.tasks_count) || 0,
            tags: Array.isArray(dbProject.tags) ? dbProject.tags.map(String) : [],
            organizationId: user.organization_id
          };
          
          transformedProjects.push(flatProject);
        }
      }

      setProjects(transformedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleAddTask = async (task: Omit<FlatTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      if (!validateUserOrganization(user)) {
        return;
      }
      
      const now = new Date();
      const taskId = uuidv4();

      const newTask = {
        ...task,
        id: taskId,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      };

      const deadlineIso = newTask.deadline instanceof Date 
        ? newTask.deadline.toISOString() 
        : new Date(newTask.deadline).toISOString();

      const insertData = addOrgIdToInsert({
        id: newTask.id,
        user_id: newTask.userId,
        project_id: newTask.projectId || null,
        title: newTask.title,
        description: newTask.description,
        deadline: deadlineIso,
        priority: newTask.priority,
        status: newTask.status,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        assigned_to_id: newTask.assignedToId || null,
        assigned_to_ids: newTask.assignedToIds || [],
        assigned_to_names: newTask.assignedToNames || [],
        cost: newTask.cost || 0,
      }, user);

      const { error } = await supabase
        .from('tasks')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Error adding task:', error);
        toast.error('Failed to add task');
        return;
      }

      setTasks([...tasks, newTask]);
      toast.success('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<FlatTask>) => {
    if (!user) return;
    
    try {
      if (!validateUserOrganization(user)) {
        return;
      }
      
      const existingTask = tasks.find((task) => task.id === taskId);
      if (!existingTask) {
        console.error('Task not found:', taskId);
        toast.error('Failed to update task: Task not found');
        return;
      }

      const now = new Date();
      const updatedTask = {
        ...existingTask,
        ...updates,
        updatedAt: now,
      };

      const updatePayload: Record<string, any> = {
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        status: updatedTask.status,
        updated_at: now.toISOString(),
        assigned_to_id: updatedTask.assignedToId || null,
        assigned_to_ids: updatedTask.assignedToIds || [],
        assigned_to_names: updatedTask.assignedToNames || [],
        cost: updatedTask.cost || 0,
      };
      
      if (updatedTask.deadline) {
        const deadlineDate = updatedTask.deadline instanceof Date 
          ? updatedTask.deadline 
          : new Date(updatedTask.deadline);
        
        if (!isNaN(deadlineDate.getTime())) {
          updatePayload.deadline = deadlineDate.toISOString();
        }
      }

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .eq('organization_id', user.organization_id!);

      if (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to update task');
        return;
      }

      setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)));
      toast.success('Task updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!user) return;
    await handleUpdateTask(taskId, { status });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      if (!validateUserOrganization(user)) {
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('organization_id', user.organization_id!);

      if (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
        return;
      }

      setTasks(tasks.filter((task) => task.id !== taskId));
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleAssignTaskToProject = async (taskId: string, projectId: string) => {
    if (!user) return;
    
    try {
      if (!validateUserOrganization(user)) {
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update({ project_id: projectId })
        .eq('id', taskId)
        .eq('organization_id', user.organization_id!);

      if (error) {
        console.error('Error assigning task to project:', error);
        toast.error('Failed to assign task to project');
        return;
      }

      setTasks(tasks.map((task) =>
        task.id === taskId ? { ...task, projectId: projectId } : task
      ));

      toast.success('Task assigned to project successfully!');
    } catch (error) {
      console.error('Error assigning task to project:', error);
      toast.error('Failed to assign task to project');
    }
  };

  const handleAssignTaskToUser = async (taskId: string, userId: string, userName: string) => {
    if (!user) return;
    
    try {
      if (!validateUserOrganization(user)) {
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update({ 
          assigned_to_id: userId, 
          assigned_to_names: [userName]
        })
        .eq('id', taskId)
        .eq('organization_id', user.organization_id!);

      if (error) {
        console.error('Error assigning task to user:', error);
        toast.error('Failed to assign task to user');
        return;
      }

      setTasks(tasks.map((task) =>
        task.id === taskId
          ? { ...task, assignedToId: userId, assignedToName: userName }
          : task
      ));

      toast.success('Task assigned to user successfully!');
    } catch (error) {
      console.error('Error assigning task to user:', error);
      toast.error('Failed to assign task to user');
    }
  };

  const handleAddProject = async (project: Omit<FlatProject, 'id' | 'createdAt' | 'updatedAt' | 'teamMemberIds'>) => {
    if (!user) return null;
    
    try {
      if (!validateUserOrganization(user)) {
        return null;
      }
      
      const now = new Date();
      const projectId = uuidv4();

      const newProject: FlatProject = {
        ...project,
        id: projectId,
        createdAt: now,
        updatedAt: now,
        teamMemberIds: [],
        organizationId: user.organization_id
      };

      const insertData = addOrgIdToInsert({
        id: newProject.id,
        title: newProject.title,
        description: newProject.description || null,
        start_date: newProject.startDate.toISOString(),
        end_date: newProject.endDate.toISOString(),
        manager_id: newProject.managerId,
        budget: newProject.budget,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        status: newProject.status,
        is_completed: newProject.is_completed,
        tasks_count: newProject.tasks_count,
        tags: newProject.tags || [],
      }, user);

      const { error } = await supabase
        .from('projects')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Error adding project:', error);
        toast.error('Failed to add project');
        return null;
      }

      setProjects([...projects, newProject]);
      toast.success('Project added successfully!');
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to add project');
      return null;
    }
  };

  const handleUpdateProject = async (projectId: string, updates: Partial<FlatProject>) => {
    if (!user?.organization_id) return;

    try {
      const updateData: Record<string, any> = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.is_completed !== undefined) updateData.is_completed = updates.is_completed;
      if (updates.budget !== undefined) updateData.budget = updates.budget;
      if (updates.teamMemberIds !== undefined) updateData.team_members = updates.teamMemberIds;

      const response = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .eq('organization_id', user.organization_id);

      const updateResponse = response as any;

      if (updateResponse.error) throw updateResponse.error;

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
      const response = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('organization_id', user.organization_id);

      const deleteResponse = response as any;

      if (deleteResponse.error) throw deleteResponse.error;

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
      const response = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          user_id: comment.userId,
          content: comment.text,
          organization_id: user.organization_id
        })
        .select()
        .single();

      const commentResponse = response as any;

      if (commentResponse.error) throw commentResponse.error;

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

export default TaskProvider;
