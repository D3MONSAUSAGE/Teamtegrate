
import { Task, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { organizationId?: string },
  user: any,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    if (!user?.organization_id) {
      toast.error('You must be logged in and belong to an organization to create tasks');
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      ...task,
      userId: task.userId || user?.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      cost: Number(task.cost) || 0,
    };

    const { error } = await supabase.from('tasks').insert({
      id: newTask.id,
      user_id: newTask.userId,
      project_id: newTask.projectId,
      title: newTask.title,
      description: newTask.description,
      deadline: newTask.deadline.toISOString(),
      priority: newTask.priority,
      status: newTask.status,
      assigned_to_id: newTask.assignedToId,
      assigned_to_ids: newTask.assignedToIds || [],
      assigned_to_names: newTask.assignedToNames || [],
      cost: newTask.cost,
      created_at: newTask.createdAt.toISOString(),
      updated_at: newTask.updatedAt.toISOString(),
      organization_id: user.organization_id
    });

    if (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return;
    }

    setTasks([...tasks, newTask]);

    if (newTask.projectId) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === newTask.projectId
            ? { ...project, tasks: [...project.tasks, newTask] }
            : project
        )
      );
    }

    toast.success('Task added successfully!');
  } catch (error) {
    console.error('Error adding task:', error);
    toast.error('Failed to add task');
  }
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  user: any,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Convert field names for database
    if (updates.userId) updateData.user_id = updates.userId;
    if (updates.projectId) updateData.project_id = updates.projectId;
    if (updates.assignedToId) updateData.assigned_to_id = updates.assignedToId;
    if (updates.assignedToIds) updateData.assigned_to_ids = updates.assignedToIds;
    if (updates.assignedToNames) updateData.assigned_to_names = updates.assignedToNames;
    if (updates.deadline) updateData.deadline = updates.deadline.toISOString();
    if (updates.completedAt) updateData.completed_at = updates.completedAt.toISOString();

    // Remove the original camelCase fields
    delete updateData.userId;
    delete updateData.projectId;
    delete updateData.assignedToId;
    delete updateData.assignedToIds;
    delete updateData.assignedToNames;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.completedAt;

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return;
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      )
    );

    setProjects((prevProjects) =>
      prevProjects.map((project) => ({
        ...project,
        tasks: project.tasks.map((task) =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        ),
      }))
    );

    toast.success('Task updated successfully!');
  } catch (error) {
    console.error('Error updating task:', error);
    toast.error('Failed to update task');
  }
};

export const updateTaskStatus = async (
  taskId: string,
  status: any,
  user: any,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setDailyScore?: React.Dispatch<React.SetStateAction<any>>
): Promise<void> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'Completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      return;
    }

    const updatedTask = {
      status,
      updatedAt: new Date(),
      ...(status === 'Completed' && { completedAt: new Date() }),
    };

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, ...updatedTask } : task
      )
    );

    setProjects((prevProjects) =>
      prevProjects.map((project) => ({
        ...project,
        tasks: project.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedTask } : task
        ),
      }))
    );

    toast.success('Task status updated successfully!');
  } catch (error) {
    console.error('Error updating task status:', error);
    toast.error('Failed to update task status');
  }
};
