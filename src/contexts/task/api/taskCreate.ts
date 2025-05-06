
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { playSuccessSound } from '@/utils/sounds';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: { id: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    console.log('Adding new task:', task);
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
          project_id: newTask.projectId,
          title: newTask.title,
          description: newTask.description,
          deadline: newTask.deadline.toISOString(),
          priority: newTask.priority,
          status: newTask.status,
          created_at: newTask.createdAt.toISOString(),
          updated_at: newTask.updatedAt.toISOString(),
          assigned_to_id: newTask.assignedToId,
          assigned_to_name: newTask.assignedToName,
          cost: newTask.cost || 0,
        },
      ])
      .select();

    if (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return;
    }

    console.log('Task added successfully, updating state');
    
    // Create a proper formatted task object to ensure all properties are set
    const formattedTask: Task = {
      ...newTask,
      tags: [],
      comments: [],
    };
    
    // Immediately update the tasks array with the new task
    setTasks(prevTasks => [...prevTasks, formattedTask]);

    // Update the project's tasks if the task is assigned to a project
    if (newTask.projectId) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === newTask.projectId
            ? { ...project, tasks: [...(project.tasks || []), formattedTask] }
            : project
        )
      );
    }

    playSuccessSound();
    toast.success('Task added successfully!');
  } catch (error) {
    console.error('Error adding task:', error);
    toast.error('Failed to add task');
  }
};
