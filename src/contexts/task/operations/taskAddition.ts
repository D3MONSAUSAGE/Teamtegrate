
import { Task, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '@/types';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const taskId = uuidv4();

    const taskToInsert = {
      id: taskId,
      user_id: user.id,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description,
      deadline: task.deadline.toISOString(),
      priority: task.priority,
      status: task.status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      assigned_to_id: task.assignedToId || null,
      assigned_to_name: task.assignedToName || null, // Make sure we're sending this to the database
      cost: task.cost || 0
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskToInsert)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding task:', error);
      playErrorSound();
      toast.error('Failed to create task');
      return;
    }

    if (data) {
      const newTask: Task = {
        id: data.id,
        userId: data.user_id || user.id,
        projectId: data.project_id || undefined,
        title: data.title || '',
        description: data.description || '',
        deadline: new Date(data.deadline || now),
        priority: (data.priority as Task['priority']) || 'Medium',
        status: (data.status as Task['status']) || 'To Do',
        createdAt: new Date(data.created_at || now),
        updatedAt: new Date(data.updated_at || now),
        assignedToId: data.assigned_to_id || undefined,
        assignedToName: data.assigned_to_name || task.assignedToName,
        tags: [],
        comments: [],
        cost: data.cost || 0,
      };

      setTasks(prevTasks => [...prevTasks, newTask]);
      
      if (newTask.projectId) {
        setProjects(prevProjects => 
          prevProjects.map(project => {
            if (project.id === newTask.projectId) {
              return {
                ...project,
                tasks: [...project.tasks, newTask]
              };
            }
            return project;
          })
        );
      }
      
      playSuccessSound();
      toast.success('Task created successfully!');
    }
  } catch (error) {
    console.error('Error in addTask:', error);
    playErrorSound();
    toast.error('Failed to create task');
  }
};
