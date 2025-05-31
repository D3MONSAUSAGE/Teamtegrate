
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const addTask = async (
  task: Omit<Task, 'id' | 'created_at' | 'updated_at'>,
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    const now = new Date();
    const taskId = uuidv4();

    const newTask = {
      ...task,
      id: taskId,
      user_id: user.id,
      created_at: now,
      updated_at: now,
    };

    // Convert any Date objects to ISO strings for Supabase
    const deadlineIso = newTask.deadline instanceof Date 
      ? newTask.deadline.toISOString() 
      : new Date(newTask.deadline).toISOString();

    // Prepare payload for Supabase with correct column names
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          id: newTask.id,
          user_id: newTask.user_id,
          project_id: newTask.project_id || null,
          title: newTask.title,
          description: newTask.description,
          deadline: deadlineIso,
          priority: newTask.priority,
          status: newTask.status,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          assigned_to_id: newTask.assigned_to_id || null,
          cost: newTask.cost || 0,
        },
      ])
      .select();

    if (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return;
    }

    // Update local state
    setTasks([...tasks, newTask]);

    // If task belongs to a project, update that project's tasks
    if (newTask.project_id) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === newTask.project_id
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
