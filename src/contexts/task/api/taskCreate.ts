
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    // Log the task being created for debugging
    console.log('Creating task:', task);
    console.log('Task has project ID?', task.projectId ? 'Yes: ' + task.projectId : 'No');

    const newTask = {
      ...task,
      id: uuidv4(),
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          id: newTask.id,
          user_id: newTask.userId,
          project_id: newTask.projectId || null,
          title: newTask.title,
          description: newTask.description,
          deadline: newTask.deadline ? newTask.deadline.toISOString() : null,
          priority: newTask.priority,
          status: newTask.status,
          created_at: newTask.createdAt.toISOString(),
          updated_at: newTask.updatedAt.toISOString(),
          assigned_to_id: newTask.assignedToId || null,
          assigned_to_name: newTask.assignedToName || null,
          cost: newTask.cost || 0,
        },
      ])
      .select();

    if (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return;
    }

    console.log('Task created in DB, updating state...');
    // Update tasks array with the new task
    setTasks(currentTasks => [...currentTasks, newTask]);
    console.log('Tasks array updated, now contains', tasks.length + 1, 'tasks');

    // Only update projects if the task has a project ID
    if (newTask.projectId) {
      console.log('Updating project with ID:', newTask.projectId);
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === newTask.projectId
            ? { ...project, tasks: [...(project.tasks || []), newTask] }
            : project
        )
      );
    } else {
      console.log('Task has no project, skipping project update');
    }

    console.log('Task added successfully:', newTask);
    toast.success('Task added successfully!');
  } catch (error) {
    console.error('Error adding task:', error);
    toast.error('Failed to add task');
  }
};
