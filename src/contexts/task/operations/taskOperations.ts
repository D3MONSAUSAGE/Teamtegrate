
import { Task, Project, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const createTask = async (
  taskData: Partial<Task>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  if (!user) return;

  try {
    const newTask: Task = {
      id: Math.random().toString(),
      title: taskData.title || '',
      description: taskData.description || '',
      priority: taskData.priority || 'Medium',
      status: 'To Do',
      deadline: taskData.deadline || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
      projectId: taskData.projectId,
      organizationId: user.organizationId,
      ...taskData
    };

    setTasks(prev => [...prev, newTask]);
    toast.success('Task created successfully');
  } catch (error) {
    console.error('Error creating task:', error);
    toast.error('Failed to create task');
  }
};

export const updateTaskInProject = async (
  taskId: string,
  updates: Partial<Task>,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
    ));

    toast.success('Task updated successfully');
  } catch (error) {
    console.error('Error updating task:', error);
    toast.error('Failed to update task');
  }
};

export const assignTaskToProject = async (
  taskId: string,
  projectId: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, projectId, updatedAt: new Date() } : task
    ));

    toast.success('Task assigned to project');
  } catch (error) {
    console.error('Error assigning task to project:', error);
    toast.error('Failed to assign task to project');
  }
};
