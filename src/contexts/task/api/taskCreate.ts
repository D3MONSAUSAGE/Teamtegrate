
import { Task } from '@/types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { addOrgIdToInsert, validateUserOrganization } from '@/utils/organizationHelpers';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: { id: string; organization_id?: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: any[],
  setProjects: React.Dispatch<React.SetStateAction<any[]>>
): Promise<void> => {
  try {
    validateUserOrganization(user);
    
    const now = new Date();
    const taskId = uuidv4();

    const newTask = {
      ...task,
      id: taskId,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    };

    // Convert any Date objects to ISO strings for Supabase
    const deadlineIso = newTask.deadline instanceof Date 
      ? newTask.deadline.toISOString() 
      : new Date(newTask.deadline).toISOString();

    // Prepare payload for Supabase with organization_id
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
      assigned_to_name: newTask.assignedToName || null,
      assigned_to_ids: newTask.assignedToIds || [],
      assigned_to_names: newTask.assignedToNames || [],
      cost: newTask.cost || 0,
    }, user);

    const { data, error } = await supabase
      .from('tasks')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return;
    }

    // Update local state
    setTasks([...tasks, newTask]);

    // If task belongs to a project, update that project's tasks
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
