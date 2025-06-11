import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

interface TaskContextType {
  tasks: Task[];
  projects: Project[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user?.organizationId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching tasks for organization:', user.organizationId);
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      // Convert data to Task format
      const formattedTasks: Task[] = (data || []).map(task => ({
        id: task.id,
        userId: task.user_id || '',
        projectId: task.project_id || undefined,
        title: task.title || '',
        description: task.description || '',
        deadline: task.deadline ? new Date(task.deadline) : new Date(),
        priority: task.priority || 'Medium',
        status: task.status || 'To Do',
        createdAt: task.created_at ? new Date(task.created_at) : new Date(),
        updatedAt: task.updated_at ? new Date(task.updated_at) : new Date(),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        assignedToId: task.assigned_to_id || undefined,
        assignedToIds: task.assigned_to_ids || [],
        assignedToNames: task.assigned_to_names || [],
        cost: Number(task.cost) || 0,
        organizationId: user.organizationId
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error in fetchTasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchProjects = useCallback(async () => {
    if (!user?.organizationId) {
      setProjects([]);
      return;
    }

    try {
      console.log('Fetching projects for organization:', user.organizationId);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      // Convert data to Project format
      const formattedProjects: Project[] = (data || []).map(project => ({
        id: project.id,
        title: project.title || '',
        description: project.description || undefined,
        startDate: project.start_date ? new Date(project.start_date) : new Date(),
        endDate: project.end_date ? new Date(project.end_date) : new Date(),
        managerId: project.manager_id || '',
        createdAt: project.created_at ? new Date(project.created_at) : new Date(),
        updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
        teamMemberIds: project.team_members || [],
        budget: Number(project.budget) || 0,
        budgetSpent: Number(project.budget_spent) || 0,
        is_completed: Boolean(project.is_completed),
        status: project.status || 'To Do',
        tasks_count: Number(project.tasks_count) || 0,
        tags: project.tags || [],
        organizationId: user.organizationId
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      toast.error('Failed to load projects');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchProjects();
    }
  }, [user, fetchTasks, fetchProjects]);

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.organizationId) {
      toast.error('Organization context required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          deadline: taskData.deadline.toISOString(),
          user_id: taskData.userId,
          project_id: taskData.projectId,
          assigned_to_id: taskData.assignedToId,
          assigned_to_ids: taskData.assignedToIds || [],
          assigned_to_names: taskData.assignedToNames || [],
          cost: taskData.cost || 0,
          organization_id: user.organizationId
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Task created successfully');
      await fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to create task');
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline.toISOString();
      if (updates.assignedToId !== undefined) updateData.assigned_to_id = updates.assignedToId;
      if (updates.assignedToIds !== undefined) updateData.assigned_to_ids = updates.assignedToIds;
      if (updates.assignedToNames !== undefined) updateData.assigned_to_names = updates.assignedToNames;
      if (updates.cost !== undefined) updateData.cost = updates.cost;

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Task updated successfully');
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Task deleted successfully');
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    await updateTask(id, { status });
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Project deleted successfully');
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString().split('T')[0];
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate.toISOString().split('T')[0];
      if (updates.budget !== undefined) updateData.budget = updates.budget;
      if (updates.teamMemberIds !== undefined) updateData.team_members = updates.teamMemberIds;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Project updated successfully');
      await fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      projects,
      addTask,
      updateTask,
      deleteTask,
      updateTaskStatus,
      deleteProject,
      updateProject,
      refreshTasks: fetchTasks,
      refreshProjects: fetchProjects,
      isLoading
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
